/**
 * Knowledge Base Controller - ALL uploads now use GCS Import API
 * 
 * IMPORTANT: The direct upload endpoint doesn't exist in Vertex AI RAG REST API.
 * ALL file uploads (manual, CSV, DOCX) MUST use GCS staging + ImportFiles API.
 */

import { type Request, type Response } from 'express';
import fs from 'fs';
import mammoth from 'mammoth';
import path from 'path';
import backgroundTaskService from '../services/backgroundTaskService';
import firebaseService from '../services/firebaseService';

const RAG_TEMP_DIR = path.join(process.cwd(), '.rag-temp');

function ensureTempDir() {
  if (!fs.existsSync(RAG_TEMP_DIR)) {
    fs.mkdirSync(RAG_TEMP_DIR, { recursive: true });
  }
}

export const getAllKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const knowledgeItems = await firebaseService.getAllKnowledge();
    (res as any).json({
      success: true,
      data: knowledgeItems,
      total: knowledgeItems.length,
    });
  } catch (error: any) {
    console.error('❌ Get all knowledge error:', error.message);
    (res as any).json({
      success: true,
      data: [],
      total: 0,
      error: 'Failed to fetch from Firestore',
      message: error.message,
    });
  }
};

export const getKnowledgeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await firebaseService.getDetailedStats();
    (res as any).json({ success: true, data: stats });
  } catch (error: any) {
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

export const getKnowledgeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      (res as any).status(400).json({ success: false, error: 'ID is required' });
      return;
    }

    const item = await firebaseService.getKnowledgeById(id as string);

    if (!item) {
      (res as any).status(404).json({ success: false, error: 'Knowledge item not found' });
      return;
    }

    (res as any).json({ success: true, data: item });
  } catch (error: any) {
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge
 * Creates Q&A: Queues for async upload to Vertex AI RAG + Saves to Firebase
 */
export const createKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      (res as any).status(400).json({ success: false, error: 'Question and answer are required' });
      return;
    }

    // Save metadata to Firebase
    const knowledgeData = await firebaseService.saveKnowledge({
      ragFileId: '',
      question: question.trim(),
      answer: answer.trim(),
      type: 'manual',
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Queue RAG upload (uses GCS staging)
    ensureTempDir();
    const tempFile = path.join(RAG_TEMP_DIR, `upload_${Date.now()}_${knowledgeData.id}.txt`);
    fs.writeFileSync(tempFile, `Q: ${question.trim()}\n\nA: ${answer.trim()}`);

    backgroundTaskService.queueTask('UPLOAD_RAG', knowledgeData.id, {
      tempFilePath: tempFile,
      displayName: question.substring(0, 100),
      description: answer.substring(0, 500),
    });

    (res as any).status(201).json({
      success: true,
      message: 'Knowledge item queued for processing',
      data: { ...knowledgeData, status: 'PROCESSING' },
    });
  } catch (error: any) {
    console.error('❌ Create knowledge error:', error.message);
    (res as any).status(500).json({ success: false, error: error.message });
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

    let knowledge = null;
    try {
      knowledge = await firebaseService.getKnowledgeById(id);
    } catch (e) {
      console.warn('⚠️  Could not fetch from Firebase');
    }

    if (!knowledge) {
      (res as any).status(404).json({ success: false, error: 'Knowledge item not found' });
      return;
    }

    await firebaseService.updateKnowledge(id, {
      question: question.trim(),
      answer: answer.trim(),
      status: 'PROCESSING',
      updatedAt: new Date().toISOString(),
    });

    ensureTempDir();
    const tempFile = path.join(RAG_TEMP_DIR, `update_${Date.now()}_${id}.txt`);
    fs.writeFileSync(tempFile, `Q: ${question.trim()}\n\nA: ${answer.trim()}`);

    backgroundTaskService.queueTask('UPDATE_RAG', id, {
      oldRagFileId: knowledge.ragFileId,
      tempFilePath: tempFile,
      displayName: question.substring(0, 100),
      description: answer.substring(0, 500),
    });

    (res as any).json({
      success: true,
      message: 'Knowledge item queued for update',
      data: { id, question: question.trim(), answer: answer.trim(), status: 'PROCESSING' },
    });
  } catch (error: any) {
    console.error('❌ Update knowledge error:', error.message);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/knowledge/:id
 */
export const deleteKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    if (!id) {
      (res as any).status(400).json({ success: false, error: 'Knowledge ID required' });
      return;
    }

    let knowledge = null;
    try {
      knowledge = await firebaseService.getKnowledgeById(id);
    } catch (e) {
      console.warn('⚠️  Could not fetch knowledge from Firebase');
    }

    if (!knowledge) {
      (res as any).status(404).json({ success: false, error: 'Knowledge item not found' });
      return;
    }

    try {
      await firebaseService.deleteKnowledge(id);
      if (knowledge.type === 'pdf' || knowledge.type === 'docx') {
        try {
          await firebaseService.deletePdfFile(id);
        } catch (error: any) {
          console.warn(`⚠️  Could not delete file:`, error.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Could not delete from Firebase:', error.message);
      (res as any).status(500).json({ success: false, error: error.message });
      return;
    }

    // Queue RAG deletion
    if (knowledge.ragFileId) {
      backgroundTaskService.queueTask('DELETE_RAG', id, {
        ragFileId: knowledge.ragFileId,
      });
    }

    (res as any).json({
      success: true,
      message: 'Knowledge item deleted',
      id,
    });
  } catch (error: any) {
    console.error('❌ Delete knowledge error:', error.message);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge/upload/csv
 * Now uses background tasks with GCS staging (same as manual/DOCX)
 */
export const uploadCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = req.body.items as { question: string; answer: string }[];
    if (!items || !items.length) {
      (res as any).status(400).json({ success: false, error: 'No items provided' });
      return;
    }

    ensureTempDir();
    const queuedItems: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        // Save to Firebase
        const knowledge = await firebaseService.saveKnowledge({
          ragFileId: '',
          question: item.question.trim(),
          answer: item.answer.trim(),
          type: 'csv',
          status: 'PROCESSING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create temp file
        const tempFile = path.join(RAG_TEMP_DIR, `csv_${Date.now()}_${i}.txt`);
        const content = `Q: ${item.question.trim()}\n\nA: ${item.answer.trim()}`;
        fs.writeFileSync(tempFile, content);

        // Queue background upload
        backgroundTaskService.queueTask('UPLOAD_RAG', knowledge.id, {
          tempFilePath: tempFile,
          displayName: item.question.substring(0, 100),
          description: item.answer.substring(0, 500),
        });

        queuedItems.push(knowledge);
      } catch (error: any) {
        console.error(`❌ CSV row ${i + 1} error:`, error);
      }
    }

    (res as any).status(201).json({
      success: true,
      message: `Queued ${queuedItems.length} of ${items.length} items for processing`,
      data: {
        queued: queuedItems.length,
        total: items.length,
      }
    });
  } catch (error: any) {
    console.error('❌ CSV upload error:', error);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge/upload/docx
 */
export const uploadDocx = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, content, title, description } = req.body;

    if (!filename || !content) {
      (res as any).status(400).json({ success: false, error: 'Filename and content are required' });
      return;
    }

    ensureTempDir();

    try {
      const buffer = Buffer.from(content, 'base64');
      const tempDocxPath = path.join(RAG_TEMP_DIR, `origin_${Date.now()}_${filename}`);
      fs.writeFileSync(tempDocxPath, buffer);

      // Extract text
      let extractedText = "";
      try {
        const result = await mammoth.extractRawText({ path: tempDocxPath });
        extractedText = result.value;
        console.log(`📄 Extracted ${extractedText.length} characters from docx`);
      } catch (extractError) {
        console.error('❌ Mammoth extraction failed:', extractError);
        throw new Error('Failed to extract text from document');
      }

      // Save metadata to Firebase
      const knowledge = await firebaseService.saveKnowledge({
        ragFileId: '',
        question: title || filename,
        answer: description || (extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')),
        type: 'docx',
        status: 'PROCESSING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Upload original file to Firebase Storage
      let fileUrl = '';
      try {
        fileUrl = await firebaseService.uploadPdfFile(buffer, filename, knowledge.id);
        console.log(`✅ Original file uploaded to Storage: ${fileUrl}`);
      } catch (storageError: any) {
        console.error('❌ Failed to upload to Storage:', storageError.message);
      }

      if (fileUrl) {
        await firebaseService.updateKnowledge(knowledge.id, { fileUrl });
      }

      // Create full text file (Vertex AI will chunk it)
      const fullTextFile = path.join(RAG_TEMP_DIR, `full_${knowledge.id}.txt`);
      fs.writeFileSync(fullTextFile, extractedText);

      // Queue upload
      backgroundTaskService.queueTask('UPLOAD_RAG', knowledge.id, {
        tempFilePath: fullTextFile,
        displayName: title || filename.substring(0, 100),
        description: description || `Extracted from: ${filename}`,
      });

      // Clean up
      try { fs.unlinkSync(tempDocxPath); } catch (e) { }

      (res as any).status(201).json({
        success: true,
        message: 'Document uploaded and processing started',
        data: {
          id: knowledge.id,
          title: knowledge.question,
          filename,
          type: 'docx',
          fileUrl,
          status: 'PROCESSING',
          createdAt: knowledge.createdAt,
        }
      });
    } catch (error: any) {
      console.error('❌ Docx upload processing error:', error);
      (res as any).status(500).json({ success: false, error: error.message });
    }
  } catch (error: any) {
    console.error('❌ Docx upload error:', error);
    (res as any).status(500).json({ success: false, error: error.message });
  }
};

export const uploadPDF = async (req: Request, res: Response): Promise<void> => {
  (res as any).status(400).json({
    success: false,
    error: 'PDF support has been replaced by DOCX support. Please upload .docx files instead.'
  });
};

export const batchDeleteKnowledge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      (res as any).status(400).json({ success: false, error: 'No IDs provided' });
      return;
    }

    const results = { successful: 0, failed: 0 };

    for (const id of ids) {
      try {
        const knowledge = await firebaseService.getKnowledgeById(id);
        if (knowledge) {
          await firebaseService.deleteKnowledge(id);
          if (knowledge.type === 'pdf' || knowledge.type === 'docx') {
            try { await firebaseService.deletePdfFile(id); } catch (e) { }
          }
          if (knowledge.ragFileId) {
            backgroundTaskService.queueTask('DELETE_RAG', id, { ragFileId: knowledge.ragFileId });
          }
          results.successful++;
        } else {
          results.failed++;
        }
      } catch (err: any) {
        results.failed++;
      }
    }

    (res as any).json({
      success: true,
      message: `Deleted ${results.successful} items`,
      data: results
    });
  } catch (error: any) {
    (res as any).status(500).json({ success: false, error: error.message });
  }
};