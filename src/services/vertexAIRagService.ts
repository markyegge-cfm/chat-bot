import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    
    const fileId = res.data.name?.split('/').pop() || res.data.id || uuidv4();
    const resourceName = res.data.name || `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles/${fileId}`;
    
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
   */
  async retrieveContextsWithRAG(query: string, topK = 3): Promise<string> {
    if (!this.initialized || !this.client) {
      return 'I cannot answer right now. Please try again later.';
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
      
      const res = await this.client.post(geminiUrl, {
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

      if (!answer || answer.length < 20) {
        answer = `I don't have information about that in our knowledge base right now.
Please share your email and our team will get back to you.`;
      }

      // Update local cache
      this.updateLocalCache(query, answer);

      return answer;
    } catch (err: any) {
      console.error('[RAG] Error:', err.message);
      return 'An error occurred while searching the knowledge base. Please share your email.';
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

  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.client) return false;
    const url = `${this.config.endpoint}/projects/${this.config.projectId}/locations/${this.config.location}/ragCorpora/${this.config.corpusId}/ragFiles/${fileId}`;
    await this.client.delete(url);
    return true;
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