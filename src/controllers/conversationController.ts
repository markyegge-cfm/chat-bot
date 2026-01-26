/**
 * Conversation Controller
 * Handles conversation session management and message routing
 */

import type { Request, Response } from 'express';
import conversationService from '../services/conversationService';

export class ConversationController {
  /**
   * Start a new conversation session
   * POST /api/conversations/start
   */
  static async startConversation(req: Request, res: Response): Promise<void> {
    try {
      const { userId, sessionId } = req.body;

      if (!userId || !sessionId) {
        res.status(400).json({ error: 'Missing userId or sessionId' });
        return;
      }

      const session = await conversationService.createSession(userId, sessionId);

      res.json({
        success: true,
        session,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

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
   * Get a specific conversation
   * GET /api/conversations/:sessionId
   */
  static async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);

      const session = await conversationService.getSession(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
        return;
      }

      res.json({
        success: true,
        conversation: session,
      });
    } catch (error: any) {
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
   * Add a message to a conversation
   * POST /api/conversations/:sessionId/messages
   */
  static async addMessage(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const { sender, content } = req.body;

      if (!sender || !content) {
        res.status(400).json({ error: 'Missing sender or content' });
        return;
      }

      const message = await conversationService.addMessage(sessionId, sender, content);

      res.json({
        success: true,
        message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Update conversation status
   * PATCH /api/conversations/:sessionId/status
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const { status } = req.body;

      if (!['active', 'closed', 'escalated'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      await conversationService.updateStatus(sessionId, status);

      res.json({
        success: true,
        message: `Conversation status updated to ${status}`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Update conversation metadata (topic, summary)
   * PATCH /api/conversations/:sessionId/metadata
   */
  static async updateMetadata(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const { topic, summary } = req.body;

      await conversationService.updateSessionMetadata(sessionId, { topic, summary });

      res.json({
        success: true,
        message: 'Conversation metadata updated',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get conversations by status
   * GET /api/conversations/status/:status
   */
  static async getByStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = String(req.params.status);
      const limit = parseInt((req.query.limit as string) || '50');

      if (!['active', 'closed', 'escalated'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      const conversations = await conversationService.getConversationsByStatus(
        status as any,
        limit
      );

      res.json({
        success: true,
        status,
        conversations,
        count: conversations.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
