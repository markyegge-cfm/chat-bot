import type { Request, Response } from 'express';
import firebaseService from '../services/firebaseService';

export class StatsController {
  /**
   * GET /api/stats
   * Return aggregated dashboard statistics.
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const knowledgeStats = await firebaseService.getDetailedStats();
      const conversationCount = await firebaseService.getConversationCount();
      const escalations = await firebaseService.getAllEscalations();

      // Count only open escalations (not resolved) for the warning badge
      const openEscalations = escalations.filter(esc => esc.status === 'open');

      res.json({
        success: true,
        data: {
          knowledge: knowledgeStats,
          conversations: { total: conversationCount },
          escalations: {
            total: openEscalations.length, // Only count open escalations
            items: escalations // Include all items for trend graph
          }
        }
      });
    } catch (error: any) {
      console.error('Failed to get dashboard stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
  }
}

export default StatsController;
