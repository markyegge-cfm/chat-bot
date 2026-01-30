import axios, { AxiosInstance } from 'axios';
import admin from 'firebase-admin';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Export the fallback message so ChatController can match against it
export const FALLBACK_MESSAGE = `That's a great question! I don't have that specific information in our knowledge base at the moment. Could you share your email address? Our team will be happy to get back to you with a detailed answer shortly.`;

interface RagFile {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'manual' | 'csv' | 'pdf' | 'docx' | 'txt';
  createdAt: string;
  updatedAt: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface RagCorpusConfig {
  projectId: string;
  location: string;
  corpusName: string;
  corpusId: string;
  endpoint: string;
}

/**
 * Service responsible for interacting with Google Cloud Vertex AI to perform RAG (Retrieval-Augmented Generation).
 * * IMPORTANT: Uses ImportFiles API with GCS staging.
 * UPDATE: Now preserves GCS files to ensure RAG source validity.
 */
class VertexAIRagService {
  private config: RagCorpusConfig;
  private client: AxiosInstance | null = null;
  private initialized = false;
  private environment: 'local' | 'cloud-run' = 'local';
  private storageBucket: any | null = null;

  constructor() {
    const loc = process.env.LOCATION || 'us-west1';
    this.config = {
      projectId: process.env.PROJECT_ID || '',
      location: loc,
      corpusName: process.env.CORPUS_NAME || '',
      corpusId: '',
      endpoint: process.env.ENDPOINT_URL || `https://${loc}-aiplatform.googleapis.com/v1beta1`,
    };

    this.environment = this.detectEnvironment();
  }

  private detectEnvironment(): 'local' | 'cloud-run' {
    return !!process.env.K_SERVICE ? 'cloud-run' : 'local';
  }

  private async getAccessToken(): Promise<string> {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) throw new Error('Failed to obtain access token');
    return token.token;
  }

  /**
   * Sets up the Google Auth client and resolves the Corpus ID.
   * This MUST be called before any other operation.
   * * NOTE: Storage bucket is initialized lazily on first upload to avoid Firebase dependency during init
   */
  async initialize(): Promise<void> {
    if (!this.config.projectId || (!this.config.corpusName && !process.env.RESOURCE_NAME)) {
      throw new Error('Missing PROJECT_ID or CORPUS_NAME');
    }

    const accessToken = await this.getAccessToken();
    this.client = axios.create({
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // Increased for import operations
    });

    await this.resolveCorpus();
    this.initialized = true;
    console.log('✅ Vertex AI RAG Service initialized');
  }

  /**
   * Initialize storage bucket lazily (on first use)
   * This avoids Firebase initialization order issues
   */
  private async ensureStorageBucket(): Promise<void> {
    if (!this.storageBucket) {
      const bucketName = process.env.STORAGE_BUCKET || `${this.config.projectId}.appspot.com`;
      this.storageBucket = admin.storage().bucket(bucketName);

      try {
        const [exists] = await this.storageBucket.exists();
        if (!exists) {
          console.log(`⚠️  Bucket ${bucketName} does not exist. Attempting to create...`);
          try {
            await this.storageBucket.create({ location: this.config.location });
            console.log(`✅ Created bucket: ${bucketName}`);
          } catch (e: any) {
            console.warn(`❌ Failed to create bucket ${bucketName}: ${e.message}`);
            console.warn(`💡 Tip: Set STORAGE_BUCKET env var to an existing bucket.`);
          }
        }
      } catch (e) {
        console.warn(`⚠️  Could not check bucket existence: ${e}`);
      }

      console.log(`🪣 Initialized GCS bucket: ${bucketName}`);
    }
  }

  /**
   * Finds the specific Corpus ID associated with the friendly display name.
   */
  private async resolveCorpus(): Promise<void> {
    if (process.env.RESOURCE_NAME) {
      const parts = process.env.RESOURCE_NAME.split('/');
      const idx = parts.indexOf('ragCorpora');
      this.config.corpusId = idx !== -1 ? parts[idx + 1] : parts.pop()!;
      return;
    }

    if (!this.client) return;
    const url = `${this.config.endpoint}/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora`;
    const res = await this.client.get(url);

    const corpus = (res.data.ragCorpora || []).find(
      (c: any) => c.displayName === this.config.corpusName
    );

    if (!corpus) throw new Error(`Corpus ${this.config.corpusName} not found`);
    this.config.corpusId = corpus.name.split('/').pop();
  }

  /**
   * Upload a file using the CORRECT method: GCS Import API
   * * This method:
   * 1. Uploads file to GCS (Permanent location)
   * 2. Calls ImportFiles API
   * 3. Returns indexed file metadata
   * * CHANGED: We no longer delete the GCS file after import. Vertex AI RAG references the
   * GCS Source URI, so the file must persist.
   */
  async uploadFile(filePath: string, displayName?: string, description?: string): Promise<RagFile> {
    if (!this.initialized || !this.client) {
      throw new Error('Not initialized');
    }

    // Ensure storage bucket is initialized (lazy init to avoid Firebase dependency during service init)
    await this.ensureStorageBucket();

    console.log(`📤 Uploading file via GCS Import: ${filePath}`);

    // Step 1: Upload to GCS
    const timestamp = Date.now();
    // CHANGED: Use 'rag-content' instead of 'rag-staging' to imply persistence
    const gcsPath = `rag-content/${timestamp}_${path.basename(filePath)}`;

    try {
      await this.storageBucket.upload(filePath, {
        destination: gcsPath,
        metadata: {
          contentType: this.getMimeType(filePath),
          metadata: {
            originalName: path.basename(filePath),
            displayName: displayName || path.basename(filePath),
          },
        },
      });

      const gcsUri = `gs://${this.storageBucket.name}/${gcsPath}`;
      console.log(`✅ Uploaded to GCS: ${gcsUri}`);

      // Step 2: Import from GCS using ImportFiles API
      const importUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles:import`;

      const importResponse = await this.client.post(importUrl, {
        importRagFilesConfig: {
          gcsSource: {
            uris: [gcsUri],
          },
          ragFileChunkingConfig: {
            chunkSize: 1024,      // tokens per chunk (recommended 512-2048)
            chunkOverlap: 200,    // token overlap (10-20% of chunk_size)
          },
          maxEmbeddingRequestsPerMin: 1000,
        },
      });

      console.log(`✅ Import operation started: ${importResponse.data.name}`);

      // Step 3: Poll operation status until complete
      const ragFile = await this.waitForImportOperation(importResponse.data.name, displayName || path.basename(filePath));

      // CHANGED: Removed GCS cleanup step. The file is preserved.
      console.log(`💾 GCS file preserved at: ${gcsPath}`);

      return ragFile;

    } catch (error: any) {
      // Clean up GCS file ONLY on error. If upload succeeded, we must keep it.
      try {
        await this.storageBucket.file(gcsPath).delete();
        console.log(`🗑️  Cleaned up failed upload: ${gcsPath}`);
      } catch (e) { }

      console.error('❌ Upload/Import failed:', error.message);
      if (error.response) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Wait for ImportFiles long-running operation to complete
   */
  private async waitForImportOperation(operationName: string, displayName: string, maxWaitMs: number = 300000): Promise<RagFile> {
    if (!this.client) throw new Error('Not initialized');

    const startTime = Date.now();
    let attempt = 0;

    while (Date.now() - startTime < maxWaitMs) {
      attempt++;

      try {
        const operationUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/${operationName}`;
        const response = await this.client.get(operationUrl);
        const operation = response.data;

        console.log(`⏳ Import operation status (attempt ${attempt}): ${operation.done ? 'DONE' : 'IN_PROGRESS'}`);

        if (operation.done) {
          if (operation.error) {
            console.error('❌ Import operation failed:', JSON.stringify(operation.error, null, 2));
            throw new Error(`Import failed: ${operation.error.message}`);
          }

          // Debug: Log the full response to understand structure
          console.log('📦 Full operation response:', JSON.stringify(operation.response, null, 2));

          // Operation completed successfully
          // The response structure is: { importRagFilesResponse: { ragFiles: [...] } }
          const importResult = operation.response;
          const importRagFilesResponse = importResult?.importRagFilesResponse || importResult;
          const ragFiles = importRagFilesResponse?.ragFiles || [];

          console.log(`📊 Found ${ragFiles.length} RAG files in response`);

          if (ragFiles.length === 0) {
            // Check if the operation actually succeeded but in a different format
            console.warn('⚠️  No ragFiles found in response. Full response:', JSON.stringify(importResult, null, 2));

            // Response doesn't include file details, but import succeeded
            // Query the corpus to find the file we just uploaded
            console.log('🔍 Querying corpus to find imported file...');

            try {
              const allFiles = await this.listFiles();

              if (allFiles.length > 0) {
                const mostRecentFile = allFiles[0];
                const fileId = mostRecentFile.name.split('/').pop() || uuidv4();

                console.log(`✅ Found imported file in corpus: ${mostRecentFile.name}`);

                return {
                  id: fileId,
                  name: mostRecentFile.name,
                  displayName: mostRecentFile.displayName || displayName,
                  description: mostRecentFile.description || '',
                  type: this.getFileType(displayName),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  status: 'COMPLETED',
                };
              }
            } catch (listError) {
              console.error('❌ Failed to query corpus:', listError);
            }

            // If import succeeded but no files listed, create a placeholder entry
            const placeholderId = uuidv4();
            const fullResourceName = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles/${placeholderId}`;

            return {
              id: placeholderId,
              name: fullResourceName, // Full resource path, not just 'ragFiles/...'
              displayName: displayName,
              description: 'Import completed successfully',
              type: this.getFileType(displayName),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'COMPLETED',
            };
          }

          const ragFile = ragFiles[0]; // First (and usually only) file
          const fileId = ragFile.name.split('/').pop() || uuidv4();

          console.log(`✅ Import completed: ${ragFile.name}`);
          console.log(`📋 File ID: ${fileId}`);
          console.log(`📄 Display Name: ${ragFile.displayName || displayName}`);

          return {
            id: fileId,
            name: ragFile.name,
            displayName: ragFile.displayName || displayName,
            description: ragFile.description || '',
            type: this.getFileType(displayName),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'COMPLETED',
          };
        }

        // Still in progress, wait before next poll
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds

      } catch (error: any) {
        if (error.response?.status === 404) {
          // Operation not found yet, wait and retry
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw error;
        }
      }
    }

    throw new Error('Import operation timed out after 5 minutes');
  }

  /**
   * The core RAG function - unchanged, but now works because files are properly indexed!
   */
  async retrieveContextsWithRAG(query: string, topK = 3): Promise<string> {
    if (!this.initialized || !this.client) {
      return 'I apologize, but I\'m currently unavailable. Please try again in a moment.';
    }

    const corpusResource = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}`;
    const geminiUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/gemini-2.5-flash:generateContent`;

    try {
      console.log(`🔍 Making RAG API call for: ${query.substring(0, 50)}...`);

      const systemPrompt = `You are a helpful and professional customer service AI assistant.

**Greeting Handling**: Respond warmly to greetings. For "Hi", "Hello", etc., say "Hi there! 👋 How can I help you today?"

**Knowledge Base Answers**: The knowledge base consists of Question and Answer pairs. When a user asks a question that matches a Q&A pair, provide the **complete and exact answer** found in the context.
- Do NOT summarize, shorten, or paraphrase the answer.
- If the answer contains steps, bullet points, links, or detailed explanations, include ALL of them exactly as they appear.
- Your priority is accuracy and completeness based on the retrieved context.

**Email Collection**: If you cannot find the answer in the knowledge base, acknowledge the question professionally and politely ask for their email.
Use this EXACT phrase if you don't know the answer: "${FALLBACK_MESSAGE}"

**Tone**: Professional yet friendly, clear, and empathetic.

**Follow-up Questions**: After providing the answer, suggest 2-3 short, relevant follow-up questions the user might ask next. Format them exactly like this at the end of your response:
<<<FOLLOWUP: Question 1 | Question 2 | Question 3>>>`;

      const res = await this.client.post(geminiUrl, {
        systemInstruction: {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{
          retrieval: {
            vertexRagStore: {
              ragResources: [{ ragCorpus: corpusResource }],
              similarityTopK: topK,
            },
          },
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048, // Increased token limit for longer answers
        },
      });

      const candidate = res.data?.candidates?.[0];
      let answer = candidate?.content?.parts?.[0]?.text || '';

      if (res.data?.candidates?.[0]?.groundingMetadata) {
        console.log('✅ Grounding metadata found - RAG is working!');
      }

      if (!answer || answer.length < 15) {
        console.warn('[RAG] No answer generated or too short. Returning fallback.');
        answer = FALLBACK_MESSAGE;
      }

      return answer;
    } catch (err: any) {
      console.error('[RAG] Error:', err.message);
      if (err.response) {
        console.error('[RAG] Response data:', JSON.stringify(err.response.data, null, 2));
      }
      return FALLBACK_MESSAGE;
    }
  }

  /**
   * Delete file - handles both full resource names and simple IDs
   */
  async deleteFile(fileIdOrResourceName: string): Promise<boolean> {
    if (!this.client) return false;

    if (!fileIdOrResourceName) {
      throw new Error('File ID or resource name is required for deletion');
    }

    let resourceName: string;

    if (fileIdOrResourceName.includes('/ragFiles/')) {
      resourceName = fileIdOrResourceName;
    } else {
      resourceName = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles/${fileIdOrResourceName}`;
    }

    const deleteUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/${resourceName}`;
    console.log(`🗑️  Deleting RAG file: ${resourceName}`);

    try {
      const response = await axios.delete(deleteUrl, {
        headers: {
          Authorization: this.client.defaults.headers['Authorization'],
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ RAG Delete: ${response.status} ${response.statusText}`);
      return true;
    } catch (error: any) {
      // If file doesn't exist (404/400), don't fail - just log and continue
      // This happens with placeholder files that were never actually created
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.warn(`⚠️  File not found in RAG corpus (may be placeholder): ${resourceName}`);
        return true; // Return success - file is "deleted" (never existed)
      }

      // For other errors, log and throw
      console.error(`❌ RAG Delete Error:`, {
        resourceName,
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  }

  async listFiles(): Promise<any[]> {
    if (!this.initialized || !this.client) throw new Error('Not initialized');

    const url = `${this.config.endpoint}/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles`;
    const res = await this.client.get(url);
    return res.data.ragFiles || [];
  }

  async getFile(fileId: string): Promise<any> {
    if (!this.initialized || !this.client) throw new Error('Not initialized');

    const url = `${this.config.endpoint}/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles/${fileId}`;
    const res = await this.client.get(url);
    return res.data;
  }

  async getCorpusStatus(): Promise<any> {
    const files = await this.listFiles();
    return files.map(f => ({
      id: f.name.split('/').pop(),
      displayName: f.displayName,
      state: f.ragFileConfig?.state || 'UNKNOWN',
      error: f.ragFileConfig?.error?.message
    }));
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.csv': return 'text/csv';
      case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.doc': return 'application/msword';
      case '.pdf': return 'application/pdf';
      case '.txt': return 'text/plain';
      default: return 'text/plain';
    }
  }

  private getFileType(filename: any): 'manual' | 'csv' | 'pdf' | 'docx' | 'txt' {
    if (typeof filename !== 'string') return 'manual';
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.docx' || ext === '.doc') return 'docx';
    if (ext === '.pdf') return 'pdf';
    if (ext === '.txt') return 'txt';
    return 'manual';
  }

  /*
   * Upload file directly using directUploadSource (JSON)
   * faster for small files like CSV rows and manual entries
   */
  async uploadFileDirect(content: string, displayName: string, description: string): Promise<RagFile> {
    if (!this.initialized || !this.client) throw new Error('Not initialized');

    const parent = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}`;
    const uploadUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/${parent}/ragFiles:upload`;

    console.log(`📤 Direct Uploading ${displayName}...`);

    try {
      // Convert content to base64
      const base64Content = Buffer.from(content).toString('base64');

      const res = await this.client.post(uploadUrl, {
        ragFile: {
          displayName: displayName,
          description: description,
          directUploadSource: {
            content: base64Content,
          },
        },
      });

      // Handle response structure (might be nested or flat depending on API version/response)
      // The user reference shows res.data having proper fields directly or via ragFile
      const ragFile = res.data.ragFile || res.data;

      // Fallback for ID extraction if name is missing or different
      const fileId = ragFile.name ? ragFile.name.split('/').pop() : uuidv4();
      const resourceName = ragFile.name || `${parent}/ragFiles/${fileId}`;

      console.log(`✅ Direct upload success: ${resourceName}`);

      return {
        id: fileId,
        name: resourceName,
        displayName: ragFile.displayName || displayName,
        description: ragFile.description || description || '',
        type: 'txt',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'COMPLETED',
      };
    } catch (err: any) {
      console.error('❌ Direct upload failed:', err.message);
      if (err.response) {
        console.error('Response data:', JSON.stringify(err.response.data, null, 2));
      }
      throw err;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig() {
    return { ...this.config };
  }
}

export const vertexAIRag = new VertexAIRagService();
export default vertexAIRag;