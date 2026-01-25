/**
 * Knowledge Base Controller (Production)
 * 
 * ✅ Vertex AI RAG is the ONLY data store
 * ✅ No in-memory storage
 * ✅ Cloud Run compatible
 */

import { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import vertexAIRag from '../services/vertexAIRagService';

// Temporary file directory for uploads
const RAG_TEMP_DIR = path.join(process.cwd(), '.rag-temp');

/**
 * Ensure temp directory exists
 */
function ensureTempDir() {
  if (!fs.existsSync(RAG_TEMP_DIR)) {
    fs.mkdirSync(RAG_TEMP_DIR, { recursive: true });
  }
}

/**
 * GET /api/knowledge
 * List all files in RAG corpus
 */
export const getAllKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!vertexAIRag.isInitialized()) {
      (res as any).status(503).json({
        success: false,
        error: 'RAG service not initialized',
      });
      return;
    }

    const files = await vertexAIRag.listFiles();

    (res as any).json({
      success: true,
      data: files,
      total: files.length,
    });
  } catch (error: any) {
    (res as any).status(500).json({
      success: false,
      error: 'Failed to fetch knowledge items',
      message: error.message,
    });
  }
};

/**
 * GET /api/knowledge/stats
 * Get corpus statistics
 */
export const getKnowledgeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!vertexAIRag.isInitialized()) {
      (res as any).status(503).json({
        success: false,
        error: 'RAG service not initialized',
      });
      return;
    }

    const stats = await vertexAIRag.getStats();

    (res as any).json({
      success: true,
      data: stats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    (res as any).status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
};

/**
 * GET /api/knowledge/:id
 * Get single file by ID
 */
export const getKnowledgeById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!vertexAIRag.isInitialized()) {
      (res as any).status(503).json({
        success: false,
        error: 'RAG service not initialized',
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      (res as any).status(400).json({
        success: false,
        error: 'ID is required',
      });
      return;
    }

    const files = await vertexAIRag.listFiles();
    const file = files.find((f) => f.id === id);

    if (!file) {
      (res as any).status(404).json({
        success: false,
        error: 'File not found',
      });
      return;
    }

    (res as any).json({
      success: true,
      data: file,
    });
  } catch (error: any) {
    (res as any).status(500).json({
      success: false,
      error: 'Failed to fetch knowledge item',
      message: error.message,
    });
  }
};

/**
 * POST /api/knowledge
 * Create manual Q&A entry and upload to RAG
 */
export const createKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!vertexAIRag.isInitialized()) {
      (res as any).status(503).json({
        success: false,
        error: 'RAG service not initialized',
      });
      return;
    }

    const { question, answer } = req.body;

    // Validation
    if (!question || !answer) {
      (res as any).status(400).json({
        success: false,
        error: 'Question and answer are required',
      });
      return;
    }

    if (question.trim().length < 3) {
      (res as any).status(400).json({
        success: false,
        error: 'Question must be at least 3 characters long',
      });
      return;
    }

    if (answer.trim().length < 3) {
      (res as any).status(400).json({
        success: false,
        error: 'Answer must be at least 3 characters long',
      });
      return;
    }

    // Create temp file with Q&A
    ensureTempDir();
    const fileId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempFile = path.join(RAG_TEMP_DIR, `${fileId}.txt`);
    const content = `Q: ${question.trim()}\n\nA: ${answer.trim()}`;
    fs.writeFileSync(tempFile, content);

    // Upload to Vertex AI RAG
    const ragFile = await vertexAIRag.uploadFile(
      tempFile,
      question.substring(0, 50), // Use question as display name (truncated)
      `Manual Q&A entry`,
    );

    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // ignore cleanup errors
    }

    (res as any).status(201).json({
      success: true,
      message: 'Knowledge item created and uploaded to RAG',
      data: ragFile,
    });
  } catch (error: any) {
    (res as any).status(500).json({
      success: false,
      error: 'Failed to create knowledge item',
      message: error.message,
    });
  }
};

/**
 * PUT /api/knowledge/:id
 * Update Q&A (requires delete + recreate)
 */
export const updateKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!vertexAIRag.isInitialized()) {
      (res as any).status(503).json({
        success: false,
        error: 'RAG service not initialized',
      });
      return;
    }

    const { id } = req.params as { id: string };
    const { question, answer } = req.body;

    if (!id) {
      (res as any).status(400).json({
        success: false,
        error: 'ID is required',
      });
      return;
    }

    // Delete old file
    await vertexAIRag.deleteFile(id);

    // Create new file if both question and answer provided
    if (question && answer) {
      ensureTempDir();
      const fileId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempFile = path.join(RAG_TEMP_DIR, `${fileId}.txt`);
      const content = `Q: ${question.trim()}\n\nA: ${answer.trim()}`;
      fs.writeFileSync(tempFile, content);

      const ragFile = await vertexAIRag.uploadFile(
        tempFile,
        question.substring(0, 50),
        'Manual Q&A entry (updated)',
      );

      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // ignore
      }

      (res as any).json({
        success: true,
        message: 'Knowledge item updated in RAG',
        data: ragFile,
      });
    } else {
      (res as any).json({
        success: true,
        message: 'Knowledge item deleted from RAG',
      });
    }
  } catch (error: any) {
    (res as any).status(500).json({
      success: false,
      error: 'Failed to update knowledge item',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/knowledge/:id
 * Delete from RAG corpus
 */
export const deleteKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!vertexAIRag.isInitialized()) {
      (res as any).status(503).json({
        success: false,
        error: 'RAG service not initialized',
      });
      return;
    }

    const { id } = req.params as { id: string };

    if (!id) {
      (res as any).status(400).json({
        success: false,
        error: 'ID is required',
      });
      return;
    }

    await vertexAIRag.deleteFile(id);

    (res as any).json({
      success: true,
      message: 'Knowledge item deleted from RAG',
    });
  } catch (error: any) {
    (res as any).status(500).json({
      success: false,
      error: 'Failed to delete knowledge item',
      message: error.message,
    });
  }
};

/**
 * POST /api/knowledge/upload/csv
 * Upload CSV file to RAG corpus
 * Expected format: question,answer (CSV with headers)
 */
export const uploadCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!vertexAIRag.isInitialized()) {
      (res as any).status(503).json({
        success: false,
        error: 'RAG service not initialized',
      });
      return;
    }

    // Frontend sends parsed items array
    const items = req.body.items as { question: string; answer: string }[];

    if (!items || !Array.isArray(items) || items.length === 0) {
      (res as any).status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
      });
      return;
    }

    // Validate each item has question and answer
    const validItems = items.filter(
      (item) => item.question && item.answer && 
                typeof item.question === 'string' && 
                typeof item.answer === 'string'
    );

    if (validItems.length === 0) {
      (res as any).status(400).json({
        success: false,
        error: 'No valid Q&A pairs found',
      });
      return;
    }

    // Create CSV content from items
    ensureTempDir();
    const fileId = `csv_${Date.now()}`;
    const tempFile = path.join(RAG_TEMP_DIR, `${fileId}.csv`);
    
    // Build CSV with proper quoting
    const header = 'question,answer\n';
    const rows = validItems
      .map((item) => {
        const q = item.question.replace(/"/g, '""'); // Escape quotes
        const a = item.answer.replace(/"/g, '""');
        return `"${q}","${a}"`;
      })
      .join('\n');
    
    fs.writeFileSync(tempFile, header + rows);

    // Upload CSV to RAG
    const ragFile = await vertexAIRag.uploadFile(
      tempFile,
      `CSV Upload - ${validItems.length} Q&A pairs`,
      `Batch CSV upload with ${validItems.length} items`,
    );

    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // ignore
    }

    (res as any).status(201).json({
      success: true,
      message: `Uploaded ${validItems.length} Q&A pairs to RAG`,
      data: {
        uploadedFile: ragFile,
        successful: validItems.length,
        failed: items.length - validItems.length,
        total: items.length,
      },
    });
  } catch (error: any) {
    (res as any).status(500).json({
      success: false,
      error: 'Failed to upload CSV',
      message: error.message,
    });
  }
};
