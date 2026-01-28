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
}
