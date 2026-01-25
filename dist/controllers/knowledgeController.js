"use strict";
/**
 * Knowledge Base Controller (Production)
 *
 * ✅ Vertex AI RAG is the ONLY data store
 * ✅ No in-memory storage
 * ✅ Cloud Run compatible
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCSV = exports.deleteKnowledge = exports.updateKnowledge = exports.createKnowledge = exports.getKnowledgeById = exports.getKnowledgeStats = exports.getAllKnowledge = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vertexAIRagService_1 = __importDefault(require("../services/vertexAIRagService"));
// Temporary file directory for uploads
const RAG_TEMP_DIR = path_1.default.join(process.cwd(), '.rag-temp');
/**
 * Ensure temp directory exists
 */
function ensureTempDir() {
    if (!fs_1.default.existsSync(RAG_TEMP_DIR)) {
        fs_1.default.mkdirSync(RAG_TEMP_DIR, { recursive: true });
    }
}
/**
 * GET /api/knowledge
 * List all files in RAG corpus
 */
const getAllKnowledge = async (req, res) => {
    try {
        if (!vertexAIRagService_1.default.isInitialized()) {
            res.status(503).json({
                success: false,
                error: 'RAG service not initialized',
            });
            return;
        }
        const files = await vertexAIRagService_1.default.listFiles();
        res.json({
            success: true,
            data: files,
            total: files.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch knowledge items',
            message: error.message,
        });
    }
};
exports.getAllKnowledge = getAllKnowledge;
/**
 * GET /api/knowledge/stats
 * Get corpus statistics
 */
const getKnowledgeStats = async (req, res) => {
    try {
        if (!vertexAIRagService_1.default.isInitialized()) {
            res.status(503).json({
                success: false,
                error: 'RAG service not initialized',
            });
            return;
        }
        const stats = await vertexAIRagService_1.default.getStats();
        res.json({
            success: true,
            data: stats,
            lastUpdated: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            message: error.message,
        });
    }
};
exports.getKnowledgeStats = getKnowledgeStats;
/**
 * GET /api/knowledge/:id
 * Get single file by ID
 */
const getKnowledgeById = async (req, res) => {
    try {
        if (!vertexAIRagService_1.default.isInitialized()) {
            res.status(503).json({
                success: false,
                error: 'RAG service not initialized',
            });
            return;
        }
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'ID is required',
            });
            return;
        }
        const files = await vertexAIRagService_1.default.listFiles();
        const file = files.find((f) => f.id === id);
        if (!file) {
            res.status(404).json({
                success: false,
                error: 'File not found',
            });
            return;
        }
        res.json({
            success: true,
            data: file,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch knowledge item',
            message: error.message,
        });
    }
};
exports.getKnowledgeById = getKnowledgeById;
/**
 * POST /api/knowledge
 * Create manual Q&A entry and upload to RAG
 */
const createKnowledge = async (req, res) => {
    try {
        if (!vertexAIRagService_1.default.isInitialized()) {
            res.status(503).json({
                success: false,
                error: 'RAG service not initialized',
            });
            return;
        }
        const { question, answer } = req.body;
        // Validation
        if (!question || !answer) {
            res.status(400).json({
                success: false,
                error: 'Question and answer are required',
            });
            return;
        }
        if (question.trim().length < 3) {
            res.status(400).json({
                success: false,
                error: 'Question must be at least 3 characters long',
            });
            return;
        }
        if (answer.trim().length < 3) {
            res.status(400).json({
                success: false,
                error: 'Answer must be at least 3 characters long',
            });
            return;
        }
        // Create temp file with Q&A
        ensureTempDir();
        const fileId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempFile = path_1.default.join(RAG_TEMP_DIR, `${fileId}.txt`);
        const content = `Q: ${question.trim()}\n\nA: ${answer.trim()}`;
        fs_1.default.writeFileSync(tempFile, content);
        // Upload to Vertex AI RAG
        const ragFile = await vertexAIRagService_1.default.uploadFile(tempFile, question.substring(0, 50), // Use question as display name (truncated)
        `Manual Q&A entry`);
        // Clean up temp file
        try {
            fs_1.default.unlinkSync(tempFile);
        }
        catch (e) {
            // ignore cleanup errors
        }
        res.status(201).json({
            success: true,
            message: 'Knowledge item created and uploaded to RAG',
            data: ragFile,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create knowledge item',
            message: error.message,
        });
    }
};
exports.createKnowledge = createKnowledge;
/**
 * PUT /api/knowledge/:id
 * Update Q&A (requires delete + recreate)
 */
const updateKnowledge = async (req, res) => {
    try {
        if (!vertexAIRagService_1.default.isInitialized()) {
            res.status(503).json({
                success: false,
                error: 'RAG service not initialized',
            });
            return;
        }
        const { id } = req.params;
        const { question, answer } = req.body;
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'ID is required',
            });
            return;
        }
        // Delete old file
        await vertexAIRagService_1.default.deleteFile(id);
        // Create new file if both question and answer provided
        if (question && answer) {
            ensureTempDir();
            const fileId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const tempFile = path_1.default.join(RAG_TEMP_DIR, `${fileId}.txt`);
            const content = `Q: ${question.trim()}\n\nA: ${answer.trim()}`;
            fs_1.default.writeFileSync(tempFile, content);
            const ragFile = await vertexAIRagService_1.default.uploadFile(tempFile, question.substring(0, 50), 'Manual Q&A entry (updated)');
            try {
                fs_1.default.unlinkSync(tempFile);
            }
            catch (e) {
                // ignore
            }
            res.json({
                success: true,
                message: 'Knowledge item updated in RAG',
                data: ragFile,
            });
        }
        else {
            res.json({
                success: true,
                message: 'Knowledge item deleted from RAG',
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update knowledge item',
            message: error.message,
        });
    }
};
exports.updateKnowledge = updateKnowledge;
/**
 * DELETE /api/knowledge/:id
 * Delete from RAG corpus
 */
const deleteKnowledge = async (req, res) => {
    try {
        if (!vertexAIRagService_1.default.isInitialized()) {
            res.status(503).json({
                success: false,
                error: 'RAG service not initialized',
            });
            return;
        }
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'ID is required',
            });
            return;
        }
        await vertexAIRagService_1.default.deleteFile(id);
        res.json({
            success: true,
            message: 'Knowledge item deleted from RAG',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete knowledge item',
            message: error.message,
        });
    }
};
exports.deleteKnowledge = deleteKnowledge;
/**
 * POST /api/knowledge/upload/csv
 * Upload CSV file to RAG corpus
 * Expected format: question,answer (CSV with headers)
 */
const uploadCSV = async (req, res) => {
    try {
        if (!vertexAIRagService_1.default.isInitialized()) {
            res.status(503).json({
                success: false,
                error: 'RAG service not initialized',
            });
            return;
        }
        const csvData = req.body.csvData;
        if (!csvData) {
            res.status(400).json({
                success: false,
                error: 'CSV data is required',
            });
            return;
        }
        // Parse CSV
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            res.status(400).json({
                success: false,
                error: 'CSV must have header and at least one data row',
            });
            return;
        }
        // Skip header, process data rows
        const dataLines = lines.slice(1);
        const items = [];
        for (const line of dataLines) {
            const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
            if (parts.length >= 2) {
                items.push({
                    question: parts[0],
                    answer: parts.slice(1).join(','), // Handle commas in answer
                });
            }
        }
        if (items.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No valid Q&A pairs found in CSV',
            });
            return;
        }
        // Upload as single CSV file to RAG
        ensureTempDir();
        const fileId = `csv_${Date.now()}`;
        const tempFile = path_1.default.join(RAG_TEMP_DIR, `${fileId}.csv`);
        const header = 'question,answer\n';
        const rows = items
            .map((item) => `"${item.question.replace(/"/g, '""')}","${item.answer.replace(/"/g, '""')}"`)
            .join('\n');
        fs_1.default.writeFileSync(tempFile, header + rows);
        // Upload CSV to RAG
        const ragFile = await vertexAIRagService_1.default.uploadFile(tempFile, `CSV Upload - ${items.length} Q&A pairs`, `Batch CSV upload with ${items.length} items`);
        // Clean up temp file
        try {
            fs_1.default.unlinkSync(tempFile);
        }
        catch (e) {
            // ignore
        }
        res.status(201).json({
            success: true,
            message: `Uploaded ${items.length} Q&A pairs to RAG`,
            data: {
                uploadedFile: ragFile,
                itemCount: items.length,
                successCount: items.length,
                failedCount: 0,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to upload CSV',
            message: error.message,
        });
    }
};
exports.uploadCSV = uploadCSV;
