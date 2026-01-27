import type { Request, Response } from 'express';
import firebaseService from '../services/firebaseService';

export class EscalationController {
  
  /**
   * GET /api/escalations
   * Retrieves paginated escalation tickets
   */
  static async getEscalations(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 8;
      
      const result = await firebaseService.getEscalations(page, limit);
      
      res.json({ 
        success: true, 
        escalations: result.escalations,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      console.error('Error fetching escalations:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch escalations' });
    }
  }

  /**
   * POST /api/escalations
   * Manually create an escalation (optional, mostly handled by ChatController)
   */
  static async createEscalation(req: Request, res: Response): Promise<void> {
    try {
      const { user, question, reason } = req.body;
      
      if (!user || !question) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
      }

      const id = await firebaseService.createEscalation({
        user,
        question,
        reason: reason || 'Manual Entry',
        status: 'open'
      });

      res.json({ success: true, id });
    } catch (error) {
      console.error('Error creating escalation:', error);
      res.status(500).json({ success: false, error: 'Failed to create escalation' });
    }
  }
}