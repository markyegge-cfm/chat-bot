"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vertexAIRag = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class VertexAIRagService {
    constructor() {
        this.client = null;
        this.initialized = false;
        this.config = {
            projectId: process.env.PROJECT_ID || '',
            location: process.env.LOCATION || 'us-west1',
            corpusName: process.env.CORPUS_NAME || '',
            corpusId: '',
            endpoint: `https://${process.env.LOCATION || 'us-west1'}-aiplatform.googleapis.com/v1`,
        };
    }
    /**
     * Get access token using Google Application Default Credentials (ADC)
     * Works automatically on Cloud Run without any manual setup
     */
    async getAccessToken() {
        try {
            // Primary: Use google-auth-library (most reliable)
            try {
                const { GoogleAuth } = require('google-auth-library');
                const auth = new GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
                });
                const client = await auth.getClient();
                const accessToken = await client.getAccessToken();
                return accessToken.token;
            }
            catch (libError) {
                // Fallback to gcloud CLI (works on local dev)
                const { execSync } = require('child_process');
                const token = execSync('gcloud auth application-default print-access-token', {
                    encoding: 'utf-8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                }).trim();
                return token;
            }
        }
        catch (error) {
            throw new Error(`❌ Failed to get GCP access token.\n` +
                `   On Cloud Run: Ensure the default service account has "Vertex AI User" role\n` +
                `   On local dev: Run 'gcloud auth application-default login'\n` +
                `   Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Initialize Vertex AI RAG service (REQUIRED before any operations)
     * Fails fast if configuration is incomplete
     */
    async initialize() {
        try {
            // Validate required environment variables
            if (!this.config.projectId) {
                throw new Error('Missing required env var: PROJECT_ID');
            }
            if (!this.config.corpusName) {
                throw new Error('Missing required env var: CORPUS_NAME');
            }
            console.log('\n� Initializing Vertex AI RAG Engine');
            console.log('   📍 Project: ' + this.config.projectId);
            console.log('   📍 Location: ' + this.config.location);
            console.log('   📦 Corpus: ' + this.config.corpusName);
            // Authenticate with GCP
            console.log('   🔐 Authenticating...');
            const accessToken = await this.getAccessToken();
            // Create axios client with auth
            this.client = axios_1.default.create({
                baseURL: this.config.endpoint,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            });
            // Resolve corpus ID
            await this.resolveCorporus();
            this.initialized = true;
            console.log('✅ Vertex AI RAG ready\n');
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('\n❌ FATAL: RAG initialization failed');
            console.error('   ' + msg);
            console.error('   📚 See GCP_SETUP.md for configuration help\n');
            throw error; // Fail fast - no fallback mode
        }
    }
    /**
     * Resolve corpus ID from corpus name
     * Throws error if corpus not found
     */
    async resolveCorporus() {
        if (!this.client)
            throw new Error('Client not initialized');
        try {
            const parent = `projects/${this.config.projectId}/locations/${this.config.location}`;
            const response = await this.client.get(`/${parent}/ragCorpuses`);
            const corpuses = response.data.ragCorpuses || [];
            if (corpuses.length === 0) {
                throw new Error(`No RAG corpuses found in project ${this.config.projectId}.\n` +
                    `   Create a corpus in: https://console.cloud.google.com/vertex-ai/rag`);
            }
            const corpus = corpuses.find((c) => c.displayName === this.config.corpusName);
            if (!corpus) {
                const names = corpuses.map((c) => `"${c.displayName}"`).join(', ');
                throw new Error(`Corpus "${this.config.corpusName}" not found.\n` +
                    `   Available: ${names}`);
            }
            this.config.corpusId = corpus.name.split('/').pop() || '';
            console.log('   ✅ Corpus resolved: ' + this.config.corpusId);
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('401')) {
                throw new Error('Authentication failed (401).\n' +
                    '   On Cloud Run: Ensure service account has "Vertex AI User" role');
            }
            throw error;
        }
    }
    /**
     * Upload a file to RAG corpus (synchronous)
     * File is immediately embedded and indexed by Vertex AI
     */
    async uploadFile(filePath, displayName, description) {
        if (!this.initialized || !this.client || !this.config.corpusId) {
            throw new Error('RAG service not initialized');
        }
        try {
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            console.log(`   📤 Uploading: ${displayName || path_1.default.basename(filePath)}`);
            // Read and encode file
            const fileContent = fs_1.default.readFileSync(filePath);
            const base64Content = fileContent.toString('base64');
            // Determine file type
            const ext = path_1.default.extname(filePath).toLowerCase();
            let fileType = 'pdf';
            if (ext === '.csv')
                fileType = 'csv';
            else if (ext === '.docx' || ext === '.doc')
                fileType = 'docx';
            else if (ext === '.txt')
                fileType = 'manual';
            const parent = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpuses/${this.config.corpusId}`;
            const requestBody = {
                ragFile: {
                    displayName: displayName || path_1.default.basename(filePath),
                    description: description || '',
                    directUploadSource: {
                        content: base64Content,
                    },
                },
            };
            const response = await this.client.post(`/${parent}/ragFiles:upload`, requestBody);
            const ragFile = {
                id: response.data.name?.split('/').pop() || (0, uuid_1.v4)(),
                name: response.data.name || '',
                displayName: response.data.displayName || displayName || '',
                description: response.data.description,
                type: fileType,
                createdAt: response.data.createTime || new Date().toISOString(),
                updatedAt: response.data.updateTime || new Date().toISOString(),
                status: response.data.processingState || 'COMPLETED',
            };
            console.log(`   ✅ Uploaded: ${ragFile.id}`);
            return ragFile;
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`   ❌ Upload failed: ${msg}`);
            throw error;
        }
    }
    /**
     * List all files in the RAG corpus
     * Returns metadata for all uploaded documents
     */
    async listFiles(pageSize = 100) {
        if (!this.initialized || !this.client || !this.config.corpusId) {
            throw new Error('RAG service not initialized');
        }
        try {
            const parent = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpuses/${this.config.corpusId}`;
            const response = await this.client.get(`/${parent}/ragFiles?pageSize=${pageSize}`);
            const files = (response.data.ragFiles || []).map((file) => ({
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
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`❌ List files failed: ${msg}`);
            throw error;
        }
    }
    /**
     * Delete a file from the RAG corpus
     */
    async deleteFile(fileId) {
        if (!this.initialized || !this.client || !this.config.corpusId) {
            throw new Error('RAG service not initialized');
        }
        try {
            console.log(`   🗑️  Deleting file: ${fileId}`);
            const name = `projects/${this.config.projectId}/locations/${this.config.location}/ragCorpuses/${this.config.corpusId}/ragFiles/${fileId}`;
            await this.client.delete(`/${name}`);
            console.log(`   ✅ Deleted: ${fileId}`);
            return true;
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`   ❌ Delete failed: ${msg}`);
            throw error;
        }
    }
    /**
     * Retrieve relevant contexts from RAG corpus for a query
     * Uses semantic search to find related documents
     */
    async retrieveContexts(query, topK = 5) {
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
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`❌ Retrieval failed: ${msg}`);
            throw error;
        }
    }
    /**
     * Get corpus statistics
     */
    async getStats() {
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
        }
        catch (error) {
            console.error('❌ Failed to get stats:', error);
            throw error;
        }
    }
    /**
     * Helper: Determine file type from name
     */
    getFileType(filename) {
        const ext = path_1.default.extname(filename).toLowerCase();
        if (ext === '.csv')
            return 'csv';
        if (ext === '.docx' || ext === '.doc')
            return 'docx';
        if (ext === '.pdf')
            return 'pdf';
        return 'manual';
    }
    /**
     * Check if RAG is initialized and ready
     */
    isInitialized() {
        return this.initialized && !!this.client;
    }
    /**
     * Get current configuration (for debugging)
     */
    getConfig() {
        return {
            projectId: this.config.projectId,
            location: this.config.location,
            corpusName: this.config.corpusName,
            corpusId: this.config.corpusId,
            initialized: this.initialized,
        };
    }
}
// Export singleton instance
exports.vertexAIRag = new VertexAIRagService();
exports.default = exports.vertexAIRag;
