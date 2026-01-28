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
      const status = req.query.status as string;
      const search = req.query.search as string;

      const result = await firebaseService.getEscalations(page, limit, status, search);

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
   * GET /api/escalations/all
   * Retrieves all escalation tickets for client-side processing
   */
  static async getAllEscalations(req: Request, res: Response): Promise<void> {
    try {
      const escalations = await firebaseService.getAllEscalations();
      res.json({ success: true, data: escalations });
    } catch (error) {
      console.error('Error fetching all escalations:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch escalations' });
    }
  }

  /**
   * POST /api/e
   * scalations
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
  /**
   * DELETE /api/escalations/:id
   * Delete an escalation ticket
   */
  static async deleteEscalation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await firebaseService.deleteEscalation(id as string);
      res.json({ success: true, message: 'Escalation deleted' });
    } catch (error) {
      console.error('Error deleting escalation:', error);
      res.status(500).json({ success: false, error: 'Failed to delete escalation' });
    }
  }

  /**
   * PATCH /api/escalations/:id/status
   * Update escalation status (open/resolved)
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body; // Expecting { status: 'open' | 'resolved' }

      if (status !== 'open' && status !== 'resolved') {
        res.status(400).json({ success: false, error: 'Invalid status' });
        return;
      }

      await firebaseService.updateEscalationStatus(id as string, status);
      res.json({ success: true, message: 'Status updated' });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ success: false, error: 'Failed to update status' });
    }
  }
}