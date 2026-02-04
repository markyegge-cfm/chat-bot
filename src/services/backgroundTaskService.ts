import fs from 'fs';
import firebaseService from './firebaseService';
import vertexAIRag from './vertexAIRagService';

const TASK_RETENTION_MS = 30000;

export type TaskType = 'UPLOAD_RAG' | 'DELETE_RAG' | 'UPDATE_RAG';

export interface BackgroundTask {
  id: string;
  type: TaskType;
  knowledgeId: string;
  data: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  error?: string;
}

class BackgroundTaskService {
  private tasks: Map<string, BackgroundTask> = new Map();
  private processing = false;

  /**
   * Queue a task to process in the background
   */
  queueTask(type: TaskType, knowledgeId: string, data: any): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: BackgroundTask = {
      id: taskId,
      type,
      knowledgeId,
      data,
      status: 'PENDING',
      createdAt: new Date(),
    };

    this.tasks.set(taskId, task);
    console.log(`📋 Queued ${type} task for knowledge ${knowledgeId}: ${taskId}`);

    // Start processing immediately if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return taskId;
  }

  /**
   * Process queued tasks sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (this.tasks.size > 0) {
      // Get the first pending task
      let task: BackgroundTask | undefined;
      for (const t of this.tasks.values()) {
        if (t.status === 'PENDING') {
          task = t;
          break;
        }
      }

      if (!task) break; // No pending tasks

      try {
        task.status = 'PROCESSING';
        console.log(`⚙️  Processing ${task.type}: ${task.id}`);

        switch (task.type) {
          case 'UPLOAD_RAG':
            await this.handleUploadRag(task);
            break;
          case 'DELETE_RAG':
            await this.handleDeleteRag(task);
            break;
          case 'UPDATE_RAG':
            await this.handleUpdateRag(task);
            break;
        }

        task.status = 'COMPLETED';
        console.log(`✅ Task completed: ${task.id}`);
      } catch (error: any) {
        task.status = 'FAILED';
        task.error = error.message;
        console.error(`❌ Task failed: ${task.id}`, error.message);
      }

      setTimeout(() => this.tasks.delete(task!.id), TASK_RETENTION_MS);
    }

    this.processing = false;
  }

  /**
   * Handle RAG upload in background
   */
  private async handleUploadRag(task: BackgroundTask): Promise<void> {
    const { tempFilePaths, tempFilePath, displayName, description } = task.data;
    const paths = tempFilePaths || (tempFilePath ? [tempFilePath] : []);

    try {
      const ragFileIds: string[] = [];
      const gcsUris: string[] = [];

      for (const filePath of paths) {
        // Upload to RAG
        const ragFile = await vertexAIRag.uploadFile(
          filePath,
          displayName,
          description
        );
        ragFileIds.push(ragFile.name);
        if (ragFile.gcsUri) {
          gcsUris.push(ragFile.gcsUri);
        }
      }

      // Update Firebase with RAG file IDs and GCS URIs
      await firebaseService.updateKnowledge(task.knowledgeId, {
        ragFileId: ragFileIds[0] || '', // Still keep primary ID for backward compatibility
        ragFileIds: ragFileIds,
        gcsUris: gcsUris, // Store GCS URIs for later deletion
        status: 'COMPLETED',
      });

      console.log(`✅ RAG Upload completed for ${task.knowledgeId}: ${ragFileIds.length} chunks`);
    } finally {
      // Clean up temp files
      for (const filePath of paths) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.warn('Could not delete temp file:', e);
        }
      }
    }
  }

  /**
   * Handle RAG deletion in background
   */
  private async handleDeleteRag(task: BackgroundTask): Promise<void> {
    const { ragFileId, ragFileIds, gcsUris, knowledgeType, knowledgeId } = task.data;
    
    let idsToDelete = ragFileIds || (ragFileId ? [ragFileId] : []);
    let urisToDelete = gcsUris || [];

    // For DOCX files, search by GCS pattern if we don't have stored URIs
    if (knowledgeType === 'docx' && knowledgeId && urisToDelete.length === 0) {
      console.log(`🔍 Searching for DOCX files with GCS pattern: full_${knowledgeId}`);
      try {
        const foundFiles = await vertexAIRag.findFilesByGcsPattern(`full_${knowledgeId}`);
        console.log(`  Found ${foundFiles.length} file(s) matching GCS pattern`);
        
        // Add any newly found files that aren't already in our list
        for (const fileResourceName of foundFiles) {
          if (!idsToDelete.includes(fileResourceName)) {
            idsToDelete.push(fileResourceName);
            console.log(`  + Added file to deletion list: ${fileResourceName.split('/').pop()}`);
          }
        }
      } catch (error: any) {
        console.warn(`  ⚠️  Could not search for DOCX files: ${error.message}`);
      }
    }

    console.log(`🗑️  Deleting ${idsToDelete.length} RAG file(s) and ${urisToDelete.length} GCS file(s) for ${knowledgeType || 'knowledge'} ${task.knowledgeId}`);

    let deletedCount = 0;
    let failedCount = 0;

    // Delete RAG file references
    for (const id of idsToDelete) {
      if (id) {
        try {
          await vertexAIRag.deleteFile(id);
          deletedCount++;
          console.log(`  ✅ Deleted RAG file: ${id.split('/').pop()}`);
        } catch (error: any) {
          failedCount++;
          console.warn(`  ⚠️  Failed to delete ${id.split('/').pop()}: ${error.message}`);
        }
      }
    }

    // Delete GCS files directly using stored URIs
    for (const gcsUri of urisToDelete) {
      if (gcsUri) {
        try {
          await vertexAIRag.deleteGcsFile(gcsUri);
          console.log(`  ✅ Deleted GCS file: ${gcsUri.split('/').pop()}`);
        } catch (error: any) {
          console.warn(`  ⚠️  Failed to delete GCS file: ${error.message}`);
        }
      }
    }

    console.log(`✅ RAG deletion complete: ${deletedCount} deleted, ${failedCount} failed`);
  }

  /**
   * Handle RAG update (upload new version) in background.
   * Old files are NOT deleted - we keep all versions in RAG.
   * The [Effective Date] stamp ensures AI prioritizes the newest content.
   */
  private async handleUpdateRag(task: BackgroundTask): Promise<void> {
    const { tempFilePath, displayName, description } = task.data;

    try {
      // Upload new version (old versions remain in RAG for historical reference)
      const ragFile = await vertexAIRag.uploadFile(
        tempFilePath,
        displayName,
        description
      );

      // Update Firebase with new RAG file ID (keep old ones in ragFileIds array)
      const existingKnowledge = await firebaseService.getKnowledgeById(task.knowledgeId);
      const oldIds = existingKnowledge?.ragFileIds || (existingKnowledge?.ragFileId ? [existingKnowledge.ragFileId] : []);
      
      await firebaseService.updateKnowledge(task.knowledgeId, {
        ragFileId: ragFile.name, // Most recent
        ragFileIds: [...oldIds, ragFile.name], // All versions
        status: 'COMPLETED',
      });

      console.log(`✅ RAG Update completed for ${task.knowledgeId}: ${ragFile.name} (${oldIds.length} older versions preserved)`);
    } finally {
      // Clean up temp file
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (e) {
        console.warn('Could not delete temp file:', e);
      }
    }
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): BackgroundTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all pending tasks
   */
  getPendingTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'PENDING' || t.status === 'PROCESSING');
  }
}

export const backgroundTaskService = new BackgroundTaskService();
export default backgroundTaskService;
