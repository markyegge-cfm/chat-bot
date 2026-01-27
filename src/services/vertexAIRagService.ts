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

class VertexAIRagService {
  private config: RagCorpusConfig;
  private client: AxiosInstance | null = null;
  private initialized = false;
  private environment: 'local' | 'cloud-run' = 'local';

  // Keeps metadata mapping only (NOT caching answers)
  private qaCache: Map<string, { question: string; answer: string }> = new Map();

  // Local answer cache for fast repeated queries
  private localAnswerCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

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
      timeout: 30000,
    });

    await this.resolveCorpus();
    this.initialized = true;
    console.log('✅ Vertex AI RAG Service initialized');
  }

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

  private checkLocalCache(query: string): string | null {
    const sanitizedQuery = query.trim().toLowerCase();
    const entry = this.localAnswerCache.get(sanitizedQuery);

    if (entry && (Date.now() - entry.timestamp) < this.CACHE_TTL) {
      console.log(`Local cache hit for query: ${query.substring(0, 50)}...`);
      return entry.answer;
    }

    // Remove expired entry
    if (entry) {
      this.localAnswerCache.delete(sanitizedQuery);
    }

    return null;
  }

  private updateLocalCache(query: string, answer: string): void {
    const sanitizedQuery = query.trim().toLowerCase();
    this.localAnswerCache.set(sanitizedQuery, {
      question: query,
      answer,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.localAnswerCache.size > this.MAX_CACHE_SIZE) {
      const firstKey = this.localAnswerCache.keys().next().value;
      if (firstKey) {
        this.localAnswerCache.delete(firstKey);
      }
    }
  }

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

    this.qaCache.set(fileId, { question: displayName || 'Untitled', answer: description || '' });

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
   * PURE RAG CALL (Stateless) with local caching
   * Enhanced prompt for better greeting handling and email collection
   */
  async retrieveContextsWithRAG(query: string, topK = 3): Promise<string> {
    if (!this.initialized || !this.client) {
      return 'I apologize, but I\'m currently unavailable. Please try again in a moment.';
    }

    // Check local cache first
    const cachedAnswer = this.checkLocalCache(query);
    if (cachedAnswer) {
      return cachedAnswer;
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

      // Update local cache
      this.updateLocalCache(query, answer);

      return answer;
    } catch (err: any) {
      console.error('[RAG] Error:', err.message);
      return FALLBACK_MESSAGE;
    }
  }

  // ---------- LEGACY + ADMIN METHODS ----------

  async retrieveContexts(query: string, topK = 5): Promise<any[]> {
    const answer = await this.retrieveContextsWithRAG(query, topK);
    return [{ text: answer }];
  }

  async listFiles(pageSize = 100): Promise<RagFile[]> {
    if (!this.initialized || !this.client) return [];

    const url = `${this.config.endpoint}/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles`;
    const res = await this.client.get(url, { params: { pageSize } });

    return (res.data.ragFiles || []).map((file: any) => {
      const id = file.name?.split('/').pop() || '';
      const cached = this.qaCache.get(id);
      return {
        id,
        name: file.name,
        displayName: cached?.question || file.displayName || 'Untitled',
        description: cached?.answer || file.description || '',
        type: this.getFileType(file.name),
        createdAt: file.createTime,
        updatedAt: file.updateTime,
        status: file.fileStatus?.state === 'ACTIVE' ? 'COMPLETED' : 'PROCESSING',
      };
    });
  }

  async getStats() {
    const files = await this.listFiles();
    return {
      totalFiles: files.length,
      byType: {
        manual: files.filter(f => f.type === 'manual').length,
        csv: files.filter(f => f.type === 'csv').length,
        pdf: files.filter(f => f.type === 'pdf').length,
        docx: files.filter(f => f.type === 'docx').length,
      },
      cacheStats: {
        localCacheSize: this.localAnswerCache.size,
        metadataCacheSize: this.qaCache.size
      }
    };
  }

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

  // Clear local cache (useful for testing)
  clearLocalCache(): void {
    this.localAnswerCache.clear();
  }
}

export const vertexAIRag = new VertexAIRagService();
export default vertexAIRag;