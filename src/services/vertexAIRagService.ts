import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Export the fallback message so ChatController can match against it
export const FALLBACK_MESSAGE = `That's a great question! I don't have that specific information in our knowledge base at the moment. Could you share your email address? Our team will be happy to get back to you with a detailed answer shortly.`;

interface RagFile {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'manual' | 'csv' | 'pdf' | 'docx';
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

interface CacheEntry {
  question: string;
  answer: string;
  timestamp: number;
}

/**
 * Service responsible for interacting with Google Cloud Vertex AI to perform RAG (Retrieval-Augmented Generation).
 * It handles:
 * 1. Managing the RAG Corpus (uploading, listing, deleting files).
 * 2. Querying the Gemini model with retrieval context (RAG).
 */
class VertexAIRagService {
  private config: RagCorpusConfig;
  private client: AxiosInstance | null = null;
  private initialized = false;
  private environment: 'local' | 'cloud-run' = 'local';





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
      timeout: 30000,
    });

    await this.resolveCorpus();
    this.initialized = true;
    console.log('✅ Vertex AI RAG Service initialized');
  }

  /**
   * Finds the specific Corpus ID (e.g., '12345') associated with the friendly display name (e.g., 'My Corpus').
   * Vertex AI requires the numeric ID for API calls, not the display name.
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
   * Uploads a file (text, PDF, etc.) to Vertex AI.
   * This makes the content searchable by the RAG system.
   * Returns metadata including the new Resource Name.
   */
  async uploadFile(filePath: string, displayName?: string, description?: string): Promise<RagFile> {
    if (!this.initialized || !this.client) throw new Error('Not initialized');

    const content = fs.readFileSync(filePath).toString('base64');
    const uploadUrl = `https://${this.config.location}-aiplatform.googleapis.com/upload/v1beta1/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles:upload`;

    const res = await axios.post(uploadUrl, {
      ragFile: {
        displayName: displayName || path.basename(filePath),
        description,
        directUploadSource: { content },
      },
    }, {
      headers: {
        Authorization: this.client.defaults.headers['Authorization'],
        'Content-Type': 'application/json',
      },
    });

    console.log('[RAG Upload] Response:', JSON.stringify(res.data).substring(0, 200));

    // IMPORTANT: Resource name is nested inside ragFile object
    const fullResourceName = res.data.ragFile?.name;
    if (!fullResourceName) {
      console.error('❌ ERROR: RAG API did not return a resource name. Response:', JSON.stringify(res.data, null, 2));
      throw new Error('RAG API response missing required "ragFile.name" field');
    }

    console.log(`✅ RAG File Full Resource Name: ${fullResourceName}`);

    // Extract just the numeric ID from the resource name for cache and reference
    const fileId = fullResourceName.split('/').pop() || uuidv4();
    console.log(`ℹ️  RAG File Numeric ID: ${fileId}`);

    const resourceName = fullResourceName; // Use the full name returned by Vertex AI



    return {
      id: fileId,
      name: resourceName,
      displayName: displayName || 'Untitled',
      description: description || '',
      type: this.getFileType(filePath),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'COMPLETED',
    };
  }

  /**
   * The core RAG function.
   * 1. Checks local cache for exact matches.
   * 2. Constructs a system prompt with instructions for tone and fallback.
   * 3. Calls Gemini API with the 'retrieval' tool enabled (pointing to our corpus).
   * 4. Returns the generated answer or the fallback message.
   */
  async retrieveContextsWithRAG(query: string, topK = 3): Promise<string> {
    if (!this.initialized || !this.client) {
      return 'I apologize, but I\'m currently unavailable. Please try again in a moment.';
    }



    const corpusResource = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}`;
    const geminiUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/gemini-2.5-flash:generateContent`;

    try {
      console.log(`Making RAG API call for: ${query.substring(0, 50)}...`);

      // Enhanced system prompt for better greeting handling and email collection
      const systemPrompt = `You are a helpful and professional customer service AI assistant.

**Greeting Handling**: Respond warmly to greetings. For "Hi", "Hello", etc., say "Hi there! 👋 How can I help you today?"

**Knowledge Base Answers**: Provide clear, accurate answers based on knowledge base information. Be professional and courteous.

**Email Collection**: If you cannot find the answer in the knowledge base, acknowledge the question professionally and politely ask for their email.
Use this EXACT phrase if you don't know the answer: "${FALLBACK_MESSAGE}"

**Tone**: Professional yet friendly, clear and concise, empathetic. Keep responses to 1-4 sentences.

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
          maxOutputTokens: 1024,
        },
      });

      let answer = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Fallback response if no answer is generated
      if (!answer || answer.length < 15) {
        answer = FALLBACK_MESSAGE;
      }



      return answer;
    } catch (err: any) {
      console.error('[RAG] Error:', err.message);
      return FALLBACK_MESSAGE;
    }
  }

  // ---------- LEGACY + ADMIN METHODS ----------

  /**
   * Removes a file from the Vertex AI RAG corpus.
   * Handles both full resource names (projects/.../ragFiles/123) and simple IDs.
   */
  async deleteFile(fileIdOrResourceName: string): Promise<boolean> {
    if (!this.client) return false;

    if (!fileIdOrResourceName) {
      throw new Error('File ID or resource name is required for deletion');
    }

    let resourceName: string;

    // If it's already a full resource name (contains /ragFiles/), use it as-is
    if (fileIdOrResourceName.includes('/ragFiles/')) {
      resourceName = fileIdOrResourceName;
      console.log(`📋 Using full resource name for deletion: ${resourceName}`);
    } else {
      // Just a numeric ID, construct the full resource name
      resourceName = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles/${fileIdOrResourceName}`;
      console.log(`📋 Constructed resource name from ID '${fileIdOrResourceName}': ${resourceName}`);
    }

    // Validate that resource name has the numeric ID at the end (not a UUID)
    const lastSegment = resourceName.split('/').pop();
    if (lastSegment?.includes('-')) {
      console.warn(`⚠️  WARNING: File ID appears to be a UUID '${lastSegment}', but Vertex AI expects numeric IDs`);
    }

    // Use the same URL pattern as upload: hardcode the endpoint URL
    const deleteUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/${resourceName}`;

    console.log(`🗑️  RAG Delete URL: ${deleteUrl}`);

    try {
      // Use axios directly like uploadFile does, passing auth headers explicitly
      const response = await axios.delete(deleteUrl, {
        headers: {
          Authorization: this.client.defaults.headers['Authorization'],
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ RAG Delete Response: Status ${response.status} ${response.statusText}`);
      return true;
    } catch (error: any) {
      console.error(`❌ RAG Delete Error:`, {
        url: deleteUrl,
        resourceName,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });
      throw error;
    }
  }

  private getFileType(filename: any): 'manual' | 'csv' | 'pdf' | 'docx' {
    if (typeof filename !== 'string') return 'manual';
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.docx' || ext === '.doc') return 'docx';
    if (ext === '.pdf') return 'pdf';
    return 'manual';
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig() {
    return { ...this.config };
  }

  // No longer using local cache
}

export const vertexAIRag = new VertexAIRagService();
export default vertexAIRag;