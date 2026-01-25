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

class VertexAIRagService {
  private config: RagCorpusConfig;
  private client: AxiosInstance | null = null;
  private initialized: boolean = false;
  private environment: 'local' | 'cloud-run' = 'local';

  constructor() {
    this.config = {
      projectId: process.env.PROJECT_ID || '',
      location: process.env.LOCATION || 'us-west1',
      corpusName: process.env.CORPUS_NAME || '',
      corpusId: '',
      endpoint: process.env.ENDPOINT_URL || `https://${process.env.LOCATION || 'us-west1'}-aiplatform.googleapis.com/v1`,
    };

    this.environment = this.detectEnvironment();
  }

  private detectEnvironment(): 'local' | 'cloud-run' {
    const isCloudRun = !!process.env.K_SERVICE;
    return isCloudRun ? 'cloud-run' : 'local';
  }

  private async getAccessToken(): Promise<string> {
    try {
      const { GoogleAuth } = require('google-auth-library');

      const authConfig: any = {
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      };

      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        if (!fs.existsSync(credPath)) {
          throw new Error(`Service account key not found at: ${credPath}`);
        }

        authConfig.keyFilename = credPath;
        console.log(`   Using service account: ${path.basename(credPath)}`);
      } else if (this.environment === 'cloud-run') {
        console.log(`   Using Cloud Run service account`);
      } else {
        throw new Error(
          'No service account key found.\n' +
          '   GOOGLE_APPLICATION_CREDENTIALS env var not set.\n' +
          '   For local dev, create a service account key and:\n' +
          '   1. Save as: service-account-key.json\n' +
          '   2. Add to .env: GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json'
        );
      }

      const auth = new GoogleAuth(authConfig);
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        throw new Error('Failed to obtain access token');
      }

      return accessToken.token;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to authenticate with GCP: ${msg}`);
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.config.projectId) {
        throw new Error('Missing required env var: PROJECT_ID');
      }
      if (!this.config.corpusName) {
        throw new Error('Missing required env var: CORPUS_NAME');
      }

      console.log('\nInitializing Vertex AI RAG Service');
      console.log(`   Environment: ${this.environment === 'cloud-run' ? 'Cloud Run' : 'Local Dev'}`);
      console.log('   Project: ' + this.config.projectId);
      console.log('   Location: ' + this.config.location);
      console.log('   Corpus: ' + this.config.corpusName);

      console.log('   Authenticating...');
      const accessToken = await this.getAccessToken();

      this.client = axios.create({
        baseURL: this.config.endpoint,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      await this.resolveCorporus();

      this.initialized = true;
      console.log('Vertex AI RAG ready\n');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('\nFATAL: RAG initialization failed');
      console.error('   ' + msg + '\n');
      throw error;
    }
  }

  private async resolveCorporus(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const parent = `projects/${this.config.projectId}/locations/${this.config.location}`;
      const response = await this.client.get(`/${parent}/ragCorpuses`);

      const corpuses = response.data.ragCorpuses || [];

      if (corpuses.length === 0) {
        throw new Error(
          `No RAG corpuses found in project ${this.config.projectId}.\n` +
          `   Create a corpus at: https://console.cloud.google.com/vertex-ai/rag`
        );
      }

      const corpus = corpuses.find((c: any) => c.displayName === this.config.corpusName);

      if (!corpus) {
        const names = corpuses.map((c: any) => `"${c.displayName}"`).join(', ');
        throw new Error(
          `Corpus "${this.config.corpusName}" not found.\n` +
          `   Available: ${names}`
        );
      }

      this.config.corpusId = corpus.name.split('/').pop() || '';
      console.log('   Corpus resolved: ' + this.config.corpusId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error(
          'Authentication failed (401 Unauthorized).\n' +
          '   Service account missing "Vertex AI User" role.\n' +
          '   Add role at: https://console.cloud.google.com/iam-admin/iam'
        );
      }
      throw error;
    }
  }

  async uploadFile(
    filePath: string,
    displayName?: string,
    description?: string
  ): Promise<RagFile> {
    if (!this.initialized || !this.client || !this.config.corpusId) {
      throw new Error('RAG service not initialized');
    }

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      console.log(`   Uploading: ${displayName || path.basename(filePath)}`);

      const fileContent = fs.readFileSync(filePath);
      const base64Content = fileContent.toString('base64');

      const ext = path.extname(filePath).toLowerCase();
      let fileType: 'manual' | 'csv' | 'pdf' | 'docx' = 'pdf';
      if (ext === '.csv') fileType = 'csv';
      else if (ext === '.docx' || ext === '.doc') fileType = 'docx';
      else if (ext === '.txt') fileType = 'manual';

      const parent = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpuses/${this.config.corpusId}`;

      const requestBody = {
        ragFile: {
          displayName: displayName || path.basename(filePath),
          description: description || '',
          directUploadSource: {
            content: base64Content,
          },
        },
      };

      const response = await this.client.post(`/${parent}/ragFiles:upload`, requestBody);

      const ragFile: RagFile = {
        id: response.data.name?.split('/').pop() || uuidv4(),
        name: response.data.name || '',
        displayName: response.data.displayName || displayName || '',
        description: response.data.description,
        type: fileType,
        createdAt: response.data.createTime || new Date().toISOString(),
        updatedAt: response.data.updateTime || new Date().toISOString(),
        status: response.data.processingState || 'COMPLETED',
      };

      console.log(`   Uploaded: ${ragFile.id}`);
      return ragFile;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`   Upload failed: ${msg}`);
      throw error;
    }
  }

  async listFiles(pageSize: number = 100): Promise<RagFile[]> {
    if (!this.initialized || !this.client || !this.config.corpusId) {
      throw new Error('RAG service not initialized');
    }

    try {
      const parent = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpuses/${this.config.corpusId}`;

      const response = await this.client.get(`/${parent}/ragFiles?pageSize=${pageSize}`);

      const files: RagFile[] = (response.data.ragFiles || []).map((file: any) => ({
        id: file.name?.split('/').pop() || '',
        name: file.name || '',
        displayName: file.displayName || '',
        description: file.description || '',
        type: this.getFileType(file.displayName),
        createdAt: file.createTime || new Date().toISOString(),
        updatedAt: file.updateTime || new Date().toISOString(),
        status: file.processingState || 'COMPLETED',
      }));

      return files;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`List files failed: ${msg}`);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.initialized || !this.client || !this.config.corpusId) {
      throw new Error('RAG service not initialized');
    }

    try {
      console.log(`   Deleting file: ${fileId}`);

      const name = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpuses/${this.config.corpusId}/ragFiles/${fileId}`;

      await this.client.delete(`/${name}`);

      console.log(`   Deleted: ${fileId}`);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`   Delete failed: ${msg}`);
      throw error;
    }
  }

  async retrieveContexts(query: string, topK: number = 5): Promise<any[]> {
    if (!this.initialized || !this.client || !this.config.corpusId) {
      throw new Error('RAG service not initialized');
    }

    try {
      const parent = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpuses/${this.config.corpusId}`;

      const requestBody = {
        query: query,
        retrievalConfig: {
          topKDocuments: topK,
        },
      };

      const response = await this.client.post(`/${parent}:retrieveContexts`, requestBody);

      const contexts = response.data.contexts || [];
      return contexts;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Retrieval failed: ${msg}`);
      throw error;
    }
  }

  async getStats(): Promise<{
    totalFiles: number;
    byType: { manual: number; csv: number; pdf: number; docx: number };
  }> {
    try {
      const files = await this.listFiles();

      return {
        totalFiles: files.length,
        byType: {
          manual: files.filter((f) => f.type === 'manual').length,
          csv: files.filter((f) => f.type === 'csv').length,
          pdf: files.filter((f) => f.type === 'pdf').length,
          docx: files.filter((f) => f.type === 'docx').length,
        },
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  }

  private getFileType(filename: string): 'manual' | 'csv' | 'pdf' | 'docx' {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.docx' || ext === '.doc') return 'docx';
    if (ext === '.pdf') return 'pdf';
    return 'manual';
  }

  isInitialized(): boolean {
    return this.initialized && !!this.client;
  }

  getConfig() {
    return {
      projectId: this.config.projectId,
      location: this.config.location,
      corpusName: this.config.corpusName,
      corpusId: this.config.corpusId,
      initialized: this.initialized,
      environment: this.environment,
    };
  }
}

export const vertexAIRag = new VertexAIRagService();
export default vertexAIRag;
