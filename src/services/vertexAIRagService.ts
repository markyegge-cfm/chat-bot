import axios, { AxiosInstance } from 'axios';
import admin from 'firebase-admin';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const FALLBACK_MESSAGE = `That's a great question! I don't have that specific information in our knowledge base at the moment. Could you share your email address? Our team will be happy to get back to you with a detailed answer shortly.`;

const RAG_CONFIG = {
  CHUNK_SIZE: 1024,
  CHUNK_OVERLAP: 200,
  MAX_EMBEDDING_REQUESTS_PER_MIN: 1000,
  IMPORT_TIMEOUT_MS: 300000,
  POLL_INTERVAL_MS: 5000,
  RAG_TOP_K: 5,
  GENERATION_TEMPERATURE: 0.7,
  GENERATION_TOP_P: 0.95,
  GENERATION_TOP_K: 40,
  MAX_OUTPUT_TOKENS: 8192  // Maximum for Gemini 2.5 Flash - ensures no response cutoff
} as const;

interface RagFile {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'manual' | 'csv' | 'pdf' | 'docx' | 'txt';
  createdAt: string;
  updatedAt: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  gcsUri?: string; // GCS URI for deletion
}

interface RagCorpusConfig {
  projectId: string;
  location: string;
  corpusName: string;
  corpusId: string;
  endpoint: string;
}

/**
 * Service for interacting with Google Cloud Vertex AI to perform RAG (Retrieval-Augmented Generation).
 * Uses GCS Import API for file uploads. GCS files are preserved because Vertex AI references them.
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


  async uploadFile(filePath: string, displayName?: string, description?: string): Promise<RagFile> {
    if (!this.initialized || !this.client) {
      throw new Error('Not initialized');
    }

    await this.ensureStorageBucket();

    console.log(`📤 Uploading file via GCS Import: ${filePath}`);

    const timestamp = Date.now();
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

      const importUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles:import`;

      const importResponse = await this.client.post(importUrl, {
        importRagFilesConfig: {
          gcsSource: {
            uris: [gcsUri],
          },
          ragFileChunkingConfig: {
            chunkSize: RAG_CONFIG.CHUNK_SIZE,
            chunkOverlap: RAG_CONFIG.CHUNK_OVERLAP,
          },
          maxEmbeddingRequestsPerMin: RAG_CONFIG.MAX_EMBEDDING_REQUESTS_PER_MIN,
        },
      });

      console.log(`✅ Import operation started: ${importResponse.data.name}`);

      // FIX: Pass gcsUri to waitForImportOperation so it can find the correct file
      const ragFile = await this.waitForImportOperation(
        importResponse.data.name, 
        displayName || path.basename(filePath),
        gcsUri  // ← CRITICAL: Pass GCS URI for file identification
      );

      // Add the GCS URI to the ragFile object so we can delete it later
      ragFile.gcsUri = gcsUri;

      console.log(`💾 GCS file preserved at: ${gcsPath}`);

      return ragFile;

    } catch (error: any) {
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


  private async waitForImportOperation(
    operationName: string, 
    displayName: string, 
    gcsUri: string,  // ← FIX: Added parameter
    maxWaitMs: number = RAG_CONFIG.IMPORT_TIMEOUT_MS
  ): Promise<RagFile> {
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

          console.log('📦 Full operation response:', JSON.stringify(operation.response, null, 2));

          const importResult = operation.response;
          const importRagFilesResponse = importResult?.importRagFilesResponse || importResult;
          const ragFiles = importRagFilesResponse?.ragFiles || [];

          console.log(`📊 Found ${ragFiles.length} RAG files in response`);

          if (ragFiles.length === 0) {
            console.warn('⚠️  No ragFiles found in response. Searching corpus for newly imported file...');

            // STRATEGY: Poll the corpus multiple times to catch the newly imported file
            // Vertex AI may take a few seconds to make the file visible in listFiles()
            const maxPolls = 6; // Try for up to 30 seconds
            const pollDelay = 5000; // 5 seconds between polls
            
            for (let poll = 1; poll <= maxPolls; poll++) {
              try {
                if (poll > 1) {
                  console.log(`⏳ Waiting ${pollDelay/1000}s before poll attempt ${poll}/${maxPolls}...`);
                  await new Promise(resolve => setTimeout(resolve, pollDelay));
                }
                
                const allFiles = await this.listFiles();
                console.log(`🔍 Poll ${poll}/${maxPolls}: Searching ${allFiles.length} files for recently imported file`);
                
                // STRATEGY 1: Try exact GCS URI match (in case Vertex AI doesn't rename)
                let matchingFile = allFiles.find(file => {
                  const fileGcsUris = file.gcsSource?.uris || [];
                  return fileGcsUris.some((uri: string) => uri === gcsUri);
                });

                // STRATEGY 2: Try partial match on the unique filename (Vertex AI renames paths)
                if (!matchingFile) {
                  const filename = path.basename(gcsUri);
                  console.log(`   Trying filename match: ${filename}`);
                  matchingFile = allFiles.find(file => {
                    const fileGcsUris = file.gcsSource?.uris || [];
                    return fileGcsUris.some((uri: string) => uri.includes(filename));
                  });
                }

                // STRATEGY 3: Find the most recently created file (if createTime exists)
                if (!matchingFile && poll >= 2) {
                  console.log(`   Trying most recent file by timestamp...`);
                  const filesWithTime = allFiles.filter(f => f.createTime);
                  if (filesWithTime.length > 0) {
                    filesWithTime.sort((a, b) => {
                      return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
                    });
                    const newestFile = filesWithTime[0];
                    const fileAge = Date.now() - new Date(newestFile.createTime).getTime();
                    // Only use if file was created in the last 2 minutes
                    if (fileAge < 120000) {
                      matchingFile = newestFile;
                      console.log(`   Found recent file (age: ${Math.round(fileAge/1000)}s)`);
                    }
                  }
                }

                if (matchingFile) {
                  const fileId = matchingFile.name.split('/').pop() || uuidv4();
                  const actualGcsUri = matchingFile.gcsSource?.uris?.[0] || gcsUri;
                  
                  console.log(`✅ Found imported file in corpus:`);
                  console.log(`   Resource Name: ${matchingFile.name}`);
                  console.log(`   File ID: ${fileId}`);
                  console.log(`   Display Name: ${matchingFile.displayName || displayName}`);
                  console.log(`   Actual GCS URI: ${actualGcsUri}`);
                  console.log(`   Expected GCS URI: ${gcsUri}`);
                  console.log(`   Match: ${actualGcsUri === gcsUri ? 'EXACT' : 'PARTIAL'}`);

                  return {
                    id: fileId,
                    name: matchingFile.name,
                    displayName: matchingFile.displayName || displayName,
                    description: matchingFile.description || '',
                    type: this.getFileType(displayName),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    status: 'COMPLETED',
                    gcsUri: actualGcsUri, // Store the actual GCS URI
                  };
                }
                
                // If we're on the last poll attempt, show debug info
                if (poll === maxPolls) {
                  console.warn(`❌ Failed to find file after ${maxPolls} polls`);
                  console.warn(`   Expected filename: ${path.basename(gcsUri)}`);
                  console.warn(`   Total files in corpus: ${allFiles.length}`);
                  if (allFiles.length > 0) {
                    console.warn(`   Sample recent files:`);
                    allFiles.slice(0, 5).forEach(f => {
                      const uris = f.gcsSource?.uris || [];
                      const createTime = f.createTime || 'unknown';
                      console.warn(`     - ${path.basename(uris[0] || 'no-uri')} (created: ${createTime})`);
                    });
                  }
                }
              } catch (listError) {
                console.error(`❌ Failed to query corpus on poll ${poll}:`, listError);
              }
            }

            // All polling attempts failed - create placeholder
            console.error(`❌ CRITICAL: Could not find imported file in corpus after ${maxPolls} polling attempts`);
            console.error(`   This file will NOT be deletable from the RAG corpus`);
            console.error(`   Manual cleanup required in Vertex AI console`);
            
            const placeholderId = uuidv4();
            const fullResourceName = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles/${placeholderId}`;

            return {
              id: placeholderId,
              name: fullResourceName,
              displayName: displayName,
              description: 'Import completed but file not found in corpus',
              type: this.getFileType(displayName),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'COMPLETED',
            };
          }

          // Normal case: ragFiles returned in response
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

        await new Promise(resolve => setTimeout(resolve, RAG_CONFIG.POLL_INTERVAL_MS));

      } catch (error: any) {
        if (error.response?.status === 404) {
          await new Promise(resolve => setTimeout(resolve, RAG_CONFIG.POLL_INTERVAL_MS));
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Import operation timed out after ${maxWaitMs / 1000} seconds`);
  }

  /**
   * Wait for a delete operation to complete
   */
  private async waitForDeleteOperation(operationName: string, maxWaitMs: number = RAG_CONFIG.IMPORT_TIMEOUT_MS): Promise<void> {
    if (!this.client) throw new Error('Not initialized');

    const startTime = Date.now();
    let attempt = 0;

    while (Date.now() - startTime < maxWaitMs) {
      attempt++;

      try {
        const operationUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/${operationName}`;
        const response = await this.client.get(operationUrl);
        const operation = response.data;

        console.log(`⏳ Delete operation status (attempt ${attempt}): ${operation.done ? 'DONE' : 'IN_PROGRESS'}`);

        if (operation.done) {
          if (operation.error) {
            console.error('❌ Delete operation failed:', JSON.stringify(operation.error, null, 2));
            throw new Error(`Delete failed: ${operation.error.message}`);
          }

          console.log('✅ Delete operation completed successfully');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, RAG_CONFIG.POLL_INTERVAL_MS));

      } catch (error: any) {
        if (error.response?.status === 404) {
          // Operation might have completed and been cleaned up
          console.log('✅ Delete operation completed (operation not found)');
          return;
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Delete operation timed out after ${maxWaitMs / 1000} seconds`);
  }

  /**
   * Retrieve contexts using Vertex AI RAG with conversation history support
   * @param query - The user's current query
   * @param topK - Number of top results to retrieve (default: 5)
   * @param conversationHistory - Array of previous conversation messages for context
   * @returns The AI-generated response
   */
  async retrieveContextsWithRAG(
    query: string, 
    topK = RAG_CONFIG.RAG_TOP_K, 
    conversationHistory: Array<{sender: string, content: string}> = []
  ): Promise<string> {
    if (!this.initialized || !this.client) {
      throw new Error('RAG service not initialized');
    }

    const corpusResource = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}`;
    const geminiUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/gemini-2.5-flash:generateContent`;

    // Retry with exponential backoff for 429 errors
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // 2s, 4s, 8s
          console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          console.log(`🔍 Making RAG API call for: ${query.substring(0, 50)}...`);
        }

        const systemPrompt = `You are a helpful and professional customer service AI assistant for Cash Flow Machine, a trading education company.

**Your Role**: You help customers learn about Cash Flow Machine's trading education programs. You are NOT a trader and should not provide trading advice.

**Identity Questions**: 
- If asked "who are you?", "what are you?", or "are you a trader?": Respond with "I'm a customer service AI assistant for Cash Flow Machine. I can help you learn about our trading education programs and find the right course for your needs."
- DO NOT claim to be a trader or provide trading advice.
- DO NOT answer follow-up questions you suggested if the user is asking about your identity instead.

**Conversation Context**: You have access to the full conversation history. Use it to understand context and provide relevant answers.
- If the user refers to previous messages (e.g., "I have experience", "yeah I want to know more"), look at the conversation history to understand what they're referring to.
- Maintain context across the conversation - don't ask questions you already know the answer to.
- If the user expresses interest or asks follow-up questions, provide the detailed information they're seeking based on the previous context.
- DO NOT repeat the same follow-up questions you already asked.

**Helping Users Decide**:
When users say "I don't know" or "help me find" or "help me decide":
- DON'T immediately ask for email
- FIRST, ask helpful qualifying questions like:
  * "What's your current experience level with trading - complete beginner, some knowledge, or experienced?"
  * "What's your approximate investment capital range?"
  * "What's your main goal - learning the basics or building income?"
- Use their answers to recommend the appropriate program from the knowledge base

**Greeting Handling**: 
- ONLY respond with "Hi there! 👋 How can I help you today?" if the user's message is JUST a greeting like "Hi", "Hello", "Hey" with no other questions.
- If they ask a question (even if they start with "Hi"), skip the greeting and answer the question directly.

**Knowledge Base Answers**: The knowledge base consists of Question and Answer pairs. 

**Handling Multiple or Conflicting Information**:
- The knowledge base content includes an [Effective Date: YYYY-MM-DDTHH:MM:SS.sssZ] timestamp at the beginning of each piece of content.
- If you retrieve multiple pieces of information that could answer the same question, **ALWAYS compare the Effective Date timestamps**.
- **CRITICAL RULE**: Use ONLY the information from the content with the most recent (latest) timestamp.
- Completely ignore older information - treat it as if it doesn't exist.
- Example: If you see "[Effective Date: 2026-02-03T10:30:00.000Z]" and "[Effective Date: 2026-02-03T09:15:00.000Z]", use ONLY the 10:30 AM content.
- This ensures users always get the most up-to-date information, even if multiple versions exist from the same day.

**ANSWERING STRATEGY**:
When users ask broad questions about courses/programs (e.g., "Tell me about your courses", "What do you offer?"):
1. Provide a BRIEF summary (2-3 sentences max) highlighting the main offerings from the knowledge base.
2. Then ask 1-2 targeted questions to narrow down their specific interest.
3. Example structure:
   "We offer [brief mention of main programs]. To point you in the right direction - are you [question 1]? And [question 2]?"

For SPECIFIC questions (e.g., "What is the Elite Course?", "How much does it cost?"):
- Provide the FULL, EXACT answer from the knowledge base without asking clarifying questions first.

When users express interest or ask to "know more" after you've asked clarifying questions:
- Look at the conversation history to understand what topic they want to know more about.
- Provide detailed, specific information from the knowledge base about that topic.
- Don't ask generic questions - give them the information they're seeking.

**STRICT VERBATIM RULE (for specific questions)**:
1. When a user asks a SPECIFIC question found in the context (e.g., "What is the Elite Course?", "How much does it cost?"), your response MUST be the **full, exact, and verbatim content** of the answer from the context.
2. DO NOT summarize long descriptions. If the context says "The Cash Flow Machine program is a proprietary covered call method developed by Mark, a former Wall Street CEO...", you MUST include that exact phrasing.
3. DO NOT condense bullet points. If a list has 13 items, you must list all 13 items exactly as written.
4. DO NOT omit monetary values, names, or professional titles.
5. If the answer is split across multiple retrieved chunks, combine them to provide the most complete possible answer.

**Knowledge Boundaries**: Only answer based on the provided context. Do not add information from your own training data that isn't in the provided document chunks.

**Email Collection**: If you cannot find the answer in the knowledge base, acknowledge the question professionally and politely ask for their email.
Use this EXACT phrase if you don't know the answer: "${FALLBACK_MESSAGE}"
DO NOT include follow-up questions when you use the fallback message.

**Tone**: Professional, helpful, and thorough.

**Formatting**: DO NOT add emojis to your responses. Keep the text professional and emoji-free.

**CRITICAL - Follow-up Questions (MANDATORY)**:
You MUST end your response with 2-3 relevant follow-up questions ONLY when you provide an answer from the knowledge base.
DO NOT include follow-up questions if you're asking for their email or using the fallback message.

**FOLLOW-UP QUESTION RULES - READ CAREFULLY**:
1. Follow-up questions should be DIRECT, ACTIONABLE questions that users can click/ask
2. They should be KNOWLEDGE-BASED questions that can be answered from the knowledge base
3. They should NOT be conversational suggestions or yes/no questions

❌ BAD Examples (DO NOT USE):
- "Would you like to know more about pricing?" (yes/no question)
- "What's your main goal - learning the basics or building income?" (conversational, belongs in main answer)
- "Are you interested in the Elite Course?" (yes/no question)
- "Would you like to explore other options?" (vague, conversational)
- "Do you want to know about enrollment?" (yes/no question)

✅ GOOD Examples (USE THESE PATTERNS):
- "What is the pricing for the Elite Course?"
- "What topics are covered in Fast Launch?"
- "How do I enroll in the program?"
- "What are the system requirements?"
- "What is included in the course materials?"
- "What is the refund policy?"
- "How long does the course take to complete?"
- "What is the difference between Fast Launch and Elite Course?"

**FOLLOW-UP QUESTION VALIDATION**:
BEFORE suggesting a follow-up question, you MUST verify that the answer exists in the retrieved context.
- ONLY suggest questions that you can actually answer based on the knowledge base chunks you received.
- DO NOT suggest questions about topics not covered in the retrieved context.
- DO NOT make up follow-up questions - base them strictly on information present in the context.
- If the context mentions pricing, you can suggest "What is the pricing for [course name]?"
- If the context does NOT mention refund policy, DO NOT suggest "What is the refund policy?"

Format EXACTLY as shown below (copy this format precisely):

<<<FOLLOWUP: What is the pricing for Fast Launch? | What topics are covered? | How do I enroll?>>>

**REMEMBER**: 
1. Only include follow-up questions when you successfully answered from the knowledge base. 
2. Skip them for fallback/email collection messages.
3. NEVER suggest questions you cannot answer based on the retrieved context.
4. Follow-up questions must be DIRECT, SPECIFIC, and ACTIONABLE - not conversational suggestions or yes/no questions.`;
        
        // Build conversation contents with history
        const contents = [];
        
        // Add conversation history (limit to last 10 messages to avoid token overflow)
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
        
        // Add current query
        contents.push({
          role: 'user',
          parts: [{ text: query }]
        });

        const res = await this.client.post(geminiUrl, {
          systemInstruction: {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          contents: contents,
          tools: [{
            retrieval: {
              vertexRagStore: {
                ragResources: [{ ragCorpus: corpusResource }],
                similarityTopK: topK,
              },
            },
          }],
          generationConfig: {
            temperature: RAG_CONFIG.GENERATION_TEMPERATURE,
            topP: RAG_CONFIG.GENERATION_TOP_P,
            topK: RAG_CONFIG.GENERATION_TOP_K,
            maxOutputTokens: RAG_CONFIG.MAX_OUTPUT_TOKENS,
          },
        });

        const candidate = res.data?.candidates?.[0];
        let answer = candidate?.content?.parts?.[0]?.text || '';
        
        // Check finish reason
        const finishReason = candidate?.finishReason;
        if (finishReason) {
          console.log(`📝 Finish Reason: ${finishReason}`);
          
          if (finishReason === 'MAX_TOKENS') {
            console.warn('⚠️  Response was cut off due to MAX_TOKENS limit!');
            console.warn(`Current MAX_OUTPUT_TOKENS: ${RAG_CONFIG.MAX_OUTPUT_TOKENS}`);
            console.warn('Consider increasing MAX_OUTPUT_TOKENS in RAG_CONFIG');
          } else if (finishReason === 'SAFETY') {
            console.warn('⚠️  Response was blocked by safety filters');
          } else if (finishReason !== 'STOP') {
            console.warn(`⚠️  Unexpected finish reason: ${finishReason}`);
          }
        }

        if (res.data?.candidates?.[0]?.groundingMetadata) {
          console.log('✅ Grounding metadata found - RAG is working!');
        }

        if (!answer || answer.length < 15) {
          console.warn('[RAG] No answer generated or too short. Returning fallback.');
          answer = FALLBACK_MESSAGE;
        }
        
        // Check if follow-up questions are included
        if (answer.includes('<<<FOLLOWUP:')) {
          console.log('✅ Follow-up questions found in response');
        } else {
          console.warn('⚠️  No follow-up questions found in response (AI did not generate them)');
        }
        
        console.log(`RAG returned answer (length: ${answer.length}): ${answer.substring(0, 100)}...`);

        return answer;
        
      } catch (err: any) {
        lastError = err;
        
        // Check if it's a 429 rate limit error
        const is429 = err.response?.status === 429 || err.response?.data?.error?.code === 429;
        
        if (is429 && attempt < maxRetries) {
          console.warn(`⚠️  Rate limit hit (429). Retrying... (${attempt}/${maxRetries})`);
          continue; // Retry
        } else if (is429) {
          console.error('❌ Rate limit exhausted after retries.');
          throw new Error('RATE_LIMIT_EXCEEDED');
        }
        
        // For non-429 errors, fail immediately
        console.error('[RAG] Error:', err.message);
        if (err.response) {
          console.error('[RAG] Response data:', JSON.stringify(err.response.data, null, 2));
        }
        break;
      }
    }

    // If we get here, a non-retryable error occurred
    throw new Error('RAG_SERVICE_ERROR');
  }

  /**
   * Delete file - handles both full resource names and simple IDs
   * 
   * FIX: Now uses authenticated client and verifies deletion succeeded
   * 
   * Note: Only deletes the RAG corpus reference, not the GCS file.
   * GCS files should be deleted separately using deleteGcsFile() with stored URIs.
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

    console.log(`🗑️  Attempting to delete RAG file:`);
    console.log(`   Resource: ${resourceName}`);
    
    // FIX: Verify the file exists before attempting deletion
    try {
      const getUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/${resourceName}`;
      const getResponse = await this.client.get(getUrl);
      console.log(`✅ File exists in corpus:`, {
        displayName: getResponse.data.displayName,
        state: getResponse.data.fileStatus?.state || getResponse.data.ragFileConfig?.state
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`⚠️  File not found in RAG corpus (may have been already deleted): ${resourceName}`);
        return true;
      }
      console.error(`❌ Error verifying file existence:`, error.response?.data || error.message);
      // Continue with deletion attempt anyway
    }

    const deleteUrl = `https://${this.config.location}-aiplatform.googleapis.com/v1beta1/${resourceName}`;

    try {
      // FIX: Use authenticated client (not raw axios)
      const response = await this.client.delete(deleteUrl);

      console.log(`✅ RAG Delete API Response:`, {
        status: response.status,
        statusText: response.statusText,
        hasOperation: !!(response.data && response.data.name),
        operationName: response.data?.name,
        responseData: JSON.stringify(response.data, null, 2)
      });
      
      // Check if this returns an operation that needs to be polled
      if (response.data && response.data.name && response.data.name.includes('/operations/')) {
        console.log(`⏳ Delete operation started: ${response.data.name}`);
        await this.waitForDeleteOperation(response.data.name);
        console.log(`✅ Delete operation completed`);
        
        // FIX: Verify the file was actually deleted
        try {
          await this.client.get(`https://${this.config.location}-aiplatform.googleapis.com/v1beta1/${resourceName}`);
          console.error(`❌ WARNING: File still exists after delete operation completed!`);
          return false;
        } catch (verifyError: any) {
          if (verifyError.response?.status === 404) {
            console.log(`✅ Verified: File successfully deleted from corpus`);
            return true;
          }
          throw verifyError;
        }
      } else {
        console.log(`✅ RAG file deleted immediately (no operation returned)`);
        return true;
      }
      
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.warn(`⚠️  File not found in RAG corpus (may be placeholder): ${resourceName}`);
        return true;
      }

      console.error(`❌ RAG Delete Error:`, {
        resourceName,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        errorData: JSON.stringify(error.response?.data, null, 2)
      });
      throw error;
    }
  }

  /**
   * Delete a GCS file directly using its URI
   * @param gcsUri - Full GCS URI like gs://bucket/path/to/file.txt
   */
  async deleteGcsFile(gcsUri: string): Promise<void> {
    if (!gcsUri || !gcsUri.startsWith('gs://')) {
      throw new Error(`Invalid GCS URI: ${gcsUri}`);
    }

    await this.ensureStorageBucket();

    // Extract the path from the URI (gs://bucket/path -> path)
    const gcsPath = gcsUri.replace(`gs://${this.storageBucket.name}/`, '');
    
    console.log(`🗑️  Deleting GCS file: ${gcsPath}`);
    await this.storageBucket.file(gcsPath).delete();
  }

  async listFiles(): Promise<any[]> {
    if (!this.initialized || !this.client) throw new Error('Not initialized');

    const baseUrl = `${this.config.endpoint}/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles`;
    
    console.log(`📋 Listing files from corpus...`);
    
    let allFiles: any[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;
    
    // Fetch all pages
    do {
      pageCount++;
      const url: string = pageToken ? `${baseUrl}?pageToken=${pageToken}` : baseUrl;
      
      const res: any = await this.client.get(url);
      const files = res.data.ragFiles || [];
      allFiles = allFiles.concat(files);
      
      pageToken = res.data.nextPageToken;
      
      console.log(`   Page ${pageCount}: ${files.length} files (total so far: ${allFiles.length})`);
      
    } while (pageToken);
    
    console.log(`✅ Total files in corpus: ${allFiles.length}`);
    
    // Log first file structure for debugging
    if (allFiles.length > 0 && pageCount === 1) {
      console.log(`📄 Sample file structure:`, {
        name: allFiles[0].name,
        displayName: allFiles[0].displayName,
        hasGcsSource: !!allFiles[0].gcsSource,
        gcsUris: allFiles[0].gcsSource?.uris || [],
        createTime: allFiles[0].createTime,
        updateTime: allFiles[0].updateTime,
        allKeys: Object.keys(allFiles[0])
      });
    }
    
    return allFiles;
  }

  /**
   * Find all RAG files that match a display name pattern (for finding DOCX chunks)
   */
  async findFilesByDisplayName(displayNamePattern: string): Promise<string[]> {
    try {
      const allFiles = await this.listFiles();
      const matchingFiles = allFiles
        .filter(file => {
          const displayName = file.displayName || '';
          return displayName.includes(displayNamePattern);
        })
        .map(file => file.name);
      
      console.log(`🔍 Found ${matchingFiles.length} RAG files matching display name "${displayNamePattern}"`);
      return matchingFiles;
    } catch (error) {
      console.error('Failed to search RAG files by display name:', error);
      return [];
    }
  }

  /**
   * Find all RAG files that match a GCS URI pattern (for finding DOCX files by their storage path)
   * This searches the gcsSource.uris field which contains the actual GCS path like:
   * gs://bucket/rag-content/1770152317418_full_VcYy2vZC5nyJPwk0awFR.txt
   */
  async findFilesByGcsPattern(gcsPattern: string): Promise<string[]> {
    try {
      const allFiles = await this.listFiles();
      console.log(`🔍 Searching ${allFiles.length} files for GCS pattern: ${gcsPattern}`);
      
      const matchingFiles = allFiles
        .filter(file => {
          // Check the gcsSource.uris array (it's an array, not a single string)
          const gcsUris = file.gcsSource?.uris || [];
          const gcsUri = gcsUris.length > 0 ? gcsUris[0] : '';
          const matches = gcsUri.includes(gcsPattern);
          
          if (matches) {
            console.log(`  ✓ Match found!`);
            console.log(`    File: ${file.name}`);
            console.log(`    GCS URI: ${gcsUri}`);
          }
          
          return matches;
        })
        .map(file => file.name);
      
      console.log(`🔍 Found ${matchingFiles.length} RAG file(s) matching GCS pattern "${gcsPattern}"`);
      return matchingFiles;
    } catch (error) {
      console.error('Failed to search RAG files by GCS pattern:', error);
      return [];
    }
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
      // Prepend date for recency prioritization (use full ISO timestamp for precision)
      const timestamp = new Date().toISOString();
      const datedContent = `[Effective Date: ${timestamp}]\n\n${content}`;

      // Convert content to base64
      const base64Content = Buffer.from(datedContent).toString('base64');

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