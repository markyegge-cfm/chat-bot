import fs from 'fs';
import firebaseService from './firebaseService';
import vertexAIRag from './vertexAIRagService';

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

      // Keep task in map for a bit for status checking, then remove
      setTimeout(() => this.tasks.delete(task!.id), 30000);
    }

    this.processing = false;
  }

  /**
   * Handle RAG upload in background
   */
  private async handleUploadRag(task: BackgroundTask): Promise<void> {
    const { tempFilePath, displayName, description, knowledgeData } = task.data;

    try {
      // Upload to RAG
      const ragFile = await vertexAIRag.uploadFile(
        tempFilePath,
        displayName,
        description
      );

      // Update Firebase with RAG file ID
      await firebaseService.updateKnowledge(task.knowledgeId, {
        ragFileId: ragFile.name,
        status: 'COMPLETED',
      });

      console.log(`✅ RAG Upload completed for ${task.knowledgeId}: ${ragFile.name}`);
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
   * Handle RAG deletion in background
   */
  private async handleDeleteRag(task: BackgroundTask): Promise<void> {
    const { ragFileId } = task.data;

    if (ragFileId) {
      await vertexAIRag.deleteFile(ragFileId);
      console.log(`✅ RAG Delete completed for file: ${ragFileId}`);
    }
  }

  /**
   * Handle RAG update (delete old + upload new) in background
   */
  private async handleUpdateRag(task: BackgroundTask): Promise<void> {
    const { oldRagFileId, tempFilePath, displayName, description } = task.data;

    try {
      // Delete old file
      if (oldRagFileId) {
        await vertexAIRag.deleteFile(oldRagFileId);
        console.log(`✅ Old RAG file deleted: ${oldRagFileId}`);
      }

      // Upload new file
      const ragFile = await vertexAIRag.uploadFile(
        tempFilePath,
        displayName,
        description
      );

      // Update Firebase with new RAG file ID
      await firebaseService.updateKnowledge(task.knowledgeId, {
        ragFileId: ragFile.name,
        status: 'COMPLETED',
      });

      console.log(`✅ RAG Update completed for ${task.knowledgeId}: ${ragFile.name}`);
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
