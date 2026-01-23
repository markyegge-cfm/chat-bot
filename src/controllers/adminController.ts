/**
 * Admin Controller - Handles admin dashboard and management operations
 */

import type { Request, Response } from 'express';
import type { DashboardStats } from '../models/admin';

export class AdminController {
  /**
   * Admin login
   * Phase 1: Accept any email/password
   * Phase  2 Validate with Firebase
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: { email: string; password: string } = (req as any).body;

      // Validate input
      if (!email || !password) {
        (res as any).status(400).json({
          error: 'Missing required fields: email, password',
        });
        return;
      }

      // TODO: Phase 2 - Replace with Firebase authentication
      // For Phase 1, we accept any valid email/password combination

      const loginResponse = {
        success: true,
        message: 'Login successful',
        user: {
          email,
          role: 'admin',
          loginTime: new Date().toISOString(),
        },
        // TODO: Phase 3 - Return JWT token
        token: null,
      };

      (res as any).json(loginResponse);
    } catch (error) {
      console.error('Login error:', error);
      (res as any).status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get dashboard statistics
   * Phase 1: Return dummy data
   * Phase 3: Return real data from Firestore
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats: DashboardStats = {
        totalMessages: 1849,
        resolvedPercentage: 92,
        avgResponseTime: 1.2,
        documentsIndexed: 45,
        recentActivity: [
          {
            id: '1',
            type: 'message',
            timestamp: new Date(Date.now() - 300000),
            description: 'New conversation started',
          },
          {
            id: '2',
            type: 'escalation',
            timestamp: new Date(Date.now() - 600000),
            description: 'Conversation escalated to human agent',
          },
          {
            id: '3',
            type: 'document_indexed',
            timestamp: new Date(Date.now() - 1800000),
            description: 'FAQ document indexed',
          },
        ],
      };

      (res as any).json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      (res as any).status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get conversations list
   * Query from Firestore
   */
  static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const conversations = [
        {
          id: 'conv_001',
          userId: 'user_001',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          messageCount: 8,
          status: 'active',
          lastMessage: 'How do I reset my password?',
          resolved: false,
        },
        {
          id: 'conv_002',
          userId: 'user_002',
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          messageCount: 5,
          status: 'escalated',
          lastMessage: 'I need immediate help',
          resolved: false,
        },
      ];

      (res as any).json({
        conversations,
        total: conversations.length,
        page: 1,
        pageSize: 10,
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      (res as any).status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get conversation messages
   * Query from Firestore
   */
  static async getConversationMessages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = (req as any).params;

      // TODO: Phase 3 - Query messages from Firestore for this conversation
      // For now, return empty array
      const messages: Array<{id: string; sender: string; content: string; timestamp: Date}> = [];

      (res as any).json({
        conversationId: id,
        messages,
        total: messages.length,
      });
    } catch (error) {
      console.error('Get conversation messages error:', error);
      (res as any).status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get escalations list
   * Query from Firestore
   */
  static async getEscalations(req: Request, res: Response): Promise<void> {
    try {
      const escalations = [
        {
          id: 'esc_001',
          conversationId: 'conv_002',
          reason: 'negative_sentiment',
          assignedTo: null,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          status: 'pending',
        },
      ];

      (res as any).json({
        escalations,
        total: escalations.length,
        page: 1,
        pageSize: 10,
      });
    } catch (error) {
      console.error('Get escalations error:', error);
      (res as any).status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Upload document for knowledge base
   * Full implementation with Cloud Storage and Vector Search
   */
  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Phase 3
      // 1. Save file to Cloud Storage
      // 2. Extract text from file
      // 3. Split into chunks
      // 4. Generate embeddings with Vertex AI
      // 5. Store in Vector Search
      // 6. Return success

      (res as any).status(201).json({
        message: 'Document upload endpoint - Phase 3 implementation pending',
        phase: 'Phase 1 skeleton',
      });
    } catch (error) {
      console.error('Upload document error:', error);
      (res as any).status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
