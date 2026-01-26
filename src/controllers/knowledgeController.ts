/**
 * Knowledge Base Controller (Production)
 * 
 * ✅ Vertex AI RAG stores document content for semantic search
 * ✅ Firebase Firestore stores Q&A metadata for fast retrieval
 * ✅ Cloud Run compatible
 */

import { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import firebaseService from '../services/firebaseService';
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
 * Helper to map Vertex AI file properties to UI KnowledgeItem properties
 * This ensures the frontend always receives 'question' and 'answer' keys.
 */
const mapFileToUI = (file: any) => ({
  id: file.id,
  // Map Vertex AI 'displayName' to UI 'question'
  question: file.displayName || 'Unnamed Document',
  // Map Vertex AI 'description' to UI 'answer'
  answer: file.description || 'No content description available.',
  type: file.type || 'manual',
  status: file.status,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

/**
 * GET /api/knowledge
 * List all knowledge items from Firebase Firestore
 */
export const getAllKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!firebaseService.isInitialized()) {
      // Return empty list if Firebase not yet initialized instead of error
      console.log('⚠️  Firebase service not initialized, returning empty knowledge list');
      (res as any).json({
        success: true,
        data: [],
        total: 0,
        warning: 'Firebase not yet initialized',
      });
      return;
    }

    const knowledgeItems = await firebaseService.getAllKnowledge();

    (res as any).json({
      success: true,
      data: knowledgeItems,
      total: knowledgeItems.length,
    });
  } catch (error: any) {
    console.error('❌ Get all knowledge error:', error.message);
    // Return empty list on error instead of 500 - allows UI to function
    (res as any).json({
      success: true,
      data: [],
      total: 0,
      error: 'Failed to fetch from Firestore (collection may not exist yet)',
      message: error.message,
    });
  }
};

/**
 * GET /api/knowledge/stats
 */
export const getKnowledgeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!vertexAIRag.isInitialized()) {
      (res as any).status(503).json({ success: false, error: 'RAG service not initialized' });
      return;
    }
    const stats = await vertexAIRag.getStats();
    (res as any).json({ success: true, data: stats });
  } catch (error: any) {
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/knowledge/:id
 */
export const getKnowledgeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      (res as any).status(400).json({ success: false, error: 'ID is required' });
      return;
    }

    const files = await vertexAIRag.listFiles();
    const file = files.find((f) => f.id === String(id));

    if (!file) {
      (res as any).status(404).json({ success: false, error: 'File not found' });
      return;
    }

    (res as any).json({ 
      success: true, 
      data: mapFileToUI(file) 
    });
  } catch (error: any) {
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge
 * Creates Q&A: Uploads to Vertex AI RAG + Saves metadata to Firebase
 */
export const createKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      (res as any).status(400).json({ success: false, error: 'Question and answer are required' });
      return;
    }

    // 1. Upload document to Vertex AI RAG for semantic search
    ensureTempDir();
    const fileId = `qa_${Date.now()}`;
    const tempFile = path.join(RAG_TEMP_DIR, `${fileId}.txt`);
    fs.writeFileSync(tempFile, `Q: ${question.trim()}\n\nA: ${answer.trim()}`);

    const ragFile = await vertexAIRag.uploadFile(
      tempFile,
      question.substring(0, 100),
      answer.substring(0, 500)
    );

    try { fs.unlinkSync(tempFile); } catch (e) {}

    // Handle case where ragFile might not have a name property
    if (!ragFile || !ragFile.name) {
      console.error('❌ RAG file upload returned invalid structure:', ragFile);
      return (res as any).status(500).json({
        success: false,
        error: 'Failed to upload file to RAG - invalid response from Vertex AI',
      });
    }

    // 2. Save metadata to Firebase Firestore
    const knowledgeData = await firebaseService.saveKnowledge({
      ragFileId: ragFile.name, // Store full RAG file resource name
      question: question.trim(),
      answer: answer.trim(),
      type: 'manual',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    (res as any).status(201).json({
      success: true,
      message: 'Knowledge item created',
      data: knowledgeData,
    });
  } catch (error: any) {
    console.error('❌ Create knowledge error:', error.message);
    // Even if Firestore fails, RAG upload succeeded - still return 201
    if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
      console.log('⚠️  Firestore unavailable - but document was uploaded to Vertex AI RAG');
      (res as any).status(201).json({
        success: true,
        message: 'Knowledge item created in RAG (Firestore metadata unavailable)',
        warning: 'Firestore API may not be enabled - enable with: gcloud services enable firestore.googleapis.com',
      });
    } else {
      (res as any).status(500).json({ success: false, error: error.message });
    }
  }
};

/**
 * PUT /api/knowledge/:id
 */
export const updateKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { question, answer } = req.body;

    if (!id || !question || !answer) {
      (res as any).status(400).json({ success: false, error: 'Required fields missing' });
      return;
    }

    // Get the knowledge metadata to find the RAG file ID
    let knowledge = null;
    try {
      knowledge = await firebaseService.getKnowledgeById(id);
    } catch (e) {
      console.warn('⚠️  Could not fetch from Firebase, proceeding with update');
    }

    // Delete old file from RAG if we have the ragFileId
    if (knowledge?.ragFileId) {
      try {
        await vertexAIRag.deleteFile(knowledge.ragFileId);
      } catch (error: any) {
        console.warn('⚠️  Could not delete old file from Vertex AI RAG:', error.message);
      }
    }

    // Upload new file to RAG
    ensureTempDir();
    const tempFile = path.join(RAG_TEMP_DIR, `upd_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, `Q: ${question.trim()}\n\nA: ${answer.trim()}`);

    const ragFile = await vertexAIRag.uploadFile(tempFile, question, answer);
    try { fs.unlinkSync(tempFile); } catch (e) {}

    // Update Firebase metadata
    try {
      await firebaseService.updateKnowledge(id, {
        ragFileId: ragFile.name,
        question: question.trim(),
        answer: answer.trim(),
        updatedAt: new Date().toISOString(),
        status: 'COMPLETED',
        type: 'manual',
        createdAt: knowledge?.createdAt || new Date().toISOString(),
      });
    } catch (e) {
      console.warn('⚠️  Could not update Firestore metadata');
    }

    (res as any).json({
      success: true,
      message: 'Knowledge item updated',
      data: mapFileToUI(ragFile),
    });
  } catch (error: any) {
    console.error('❌ Update knowledge error:', error.message);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/knowledge/:id
 * Deletes from both Firebase Firestore and Vertex AI RAG
 */
export const deleteKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    
    // Get knowledge metadata from Firebase
    const knowledge = await firebaseService.getKnowledgeById(id);
    
    if (!knowledge) {
      (res as any).status(404).json({ success: false, error: 'Knowledge item not found' });
      return;
    }
    
    // 1. Delete from Vertex AI RAG
    if (knowledge.ragFileId) {
      try {
        await vertexAIRag.deleteFile(knowledge.ragFileId);
      } catch (error) {
        console.warn('⚠️  Could not delete from Vertex AI RAG:', error);
      }
    }
    
    // 2. Delete from Firebase Firestore
    await firebaseService.deleteKnowledge(id);
    
    (res as any).json({ success: true, message: 'Knowledge item deleted' });
  } catch (error: any) {
    console.error('❌ Delete knowledge error:', error);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge/upload/csv
 * Upload multiple Q&A pairs from CSV - creates individual files for each Q&A
 * Saves to both Vertex AI RAG and Firebase Firestore
 */
export const uploadCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = req.body.items as { question: string; answer: string }[];
    if (!items || !items.length) {
      (res as any).status(400).json({ success: false, error: 'No items provided' });
      return;
    }

    ensureTempDir();
    const uploadedFiles: any[] = [];
    const errors: string[] = [];

    // Upload each Q&A pair as a separate file
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        const fileId = `csv_qa_${Date.now()}_${i}`;
        const tempFile = path.join(RAG_TEMP_DIR, `${fileId}.txt`);
        const content = `Q: ${item.question.trim()}\n\nA: ${item.answer.trim()}`;
        
        fs.writeFileSync(tempFile, content);

        // 1. Upload to Vertex AI RAG
        const ragFile = await vertexAIRag.uploadFile(
          tempFile,
          item.question.substring(0, 100),
          item.answer.substring(0, 500)
        );

        // 2. Save metadata to Firebase Firestore
        await firebaseService.saveKnowledge({
          ragFileId: ragFile.name,
          question: item.question.trim(),
          answer: item.answer.trim(),
          type: 'csv',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        uploadedFiles.push(ragFile);
        
        try { fs.unlinkSync(tempFile); } catch (e) {}
      } catch (error: any) {
        console.error(`❌ CSV row ${i + 1} error:`, error);
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    (res as any).status(201).json({
      success: true,
      message: `Uploaded ${uploadedFiles.length} of ${items.length} items`,
      data: {
        successful: uploadedFiles.length,
        failed: errors.length,
        total: items.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error: any) {
    console.error('❌ CSV upload error:', error);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};