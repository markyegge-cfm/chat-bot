/**
 * Knowledge Base Routes
 * API endpoints for managing Q&A knowledge base
 */

import { Router } from 'express';
import {
    batchDeleteKnowledge,
    createKnowledge,
    deleteKnowledge,
    getAllKnowledge,
    getKnowledgeById,
    getKnowledgeStats,
    updateDocx,
    updateKnowledge,
    uploadCSV,
    uploadDocx
} from '../controllers/knowledgeController';

const router = Router();

// Get all knowledge items
router.get('/api/knowledge', getAllKnowledge);

// Get knowledge statistics
router.get('/api/knowledge/stats', getKnowledgeStats);

// Get single knowledge item
router.get('/api/knowledge/:id', getKnowledgeById);

// Create manual Q&A entry
router.post('/api/knowledge', createKnowledge);

// Update knowledge item
router.put('/api/knowledge/:id', updateKnowledge);

// Delete knowledge item
router.delete('/api/knowledge/:id', deleteKnowledge);

// Batch delete
router.post('/api/knowledge/batch-delete', batchDeleteKnowledge);

// Upload CSV
router.post('/api/knowledge/upload/csv', uploadCSV);

// Upload Docx (replaces PDF)
router.post('/api/knowledge/upload/docx', uploadDocx);
router.post('/api/knowledge/upload/pdf', uploadDocx); // Keep legacy route for frontend compatibility for now

// Update existing DOCX with new version
router.put('/api/knowledge/:id/docx', updateDocx);

// Debug: Check RAG status
router.get('/api/knowledge/debug/rag-status', async (req: any, res: any) => {
  try {
    const vertexAIRag = await import('../services/vertexAIRagService').then(m => m.default);
    const isInitialized = vertexAIRag.isInitialized?.();
    const config = vertexAIRag.getConfig?.();
    let corpusStatus = null;

    if (isInitialized) {
      try {
        corpusStatus = await vertexAIRag.getCorpusStatus();
      } catch (e: any) {
        corpusStatus = { error: e.message };
      }
    }

    res.json({
      success: true,
      initialized: isInitialized,
      config: config,
      corpusStatus: corpusStatus,
      message: isInitialized
        ? 'GCP Vertex AI RAG is initialized and ready'
        : 'GCP Vertex AI RAG is NOT initialized - check logs',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
