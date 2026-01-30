/**
 * Conversation Controller
 * Handles conversation session management and message routing
 */

import type { Request, Response } from 'express';
import conversationService from '../services/conversationService';

export class ConversationController {
  /**
   * Get all conversations (for admin)
   * GET /api/conversations?page=1&limit=20
   */
  static async getAllConversations(req: Request, res: Response): Promise<void> {
    try {
      console.log('[Conversations API] getAllConversations called - Query:', req.query);
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');

      console.log(`[Conversations API] Fetching page ${page}, limit ${limit}`);
      const { conversations, total } = await conversationService.getSessionsPaginated(
        page,
        limit
      );

      console.log(`[Conversations API] Found ${conversations.length} conversations, total: ${total}`);
      res.json({
        success: true,
        conversations,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      console.error('[Conversations API] Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get messages for a conversation
   * GET /api/conversations/:sessionId/messages
   */
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);

      const messages = await conversationService.getMessages(sessionId);

      res.json({
        success: true,
        messages,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/conversations/:sessionId
   */
  static async deleteConversation(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      await conversationService.deleteConversation(sessionId);
      res.json({ success: true, message: 'Conversation deleted' });
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/conversations/batch-delete
   */
  static async batchDeleteConversations(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, error: 'No IDs provided' });
        return;
      }
      await conversationService.batchDeleteConversations(ids);
      res.json({ success: true, message: `Deleted ${ids.length} conversations` });
    } catch (error: any) {
      console.error('Failed to batch delete conversations:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/conversations
   * Delete ALL conversations (admin action)
   */
  static async deleteAllConversations(req: Request, res: Response): Promise<void> {
    try {
      await conversationService.deleteAllConversations();
      res.json({ success: true, message: 'All conversations deleted' });
    } catch (error: any) {
      console.error('Failed to delete all conversations:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
