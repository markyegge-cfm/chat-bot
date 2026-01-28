/**
 * Escalation Routes
 * API endpoints for managing escalation tickets
 */

import express from 'express';
import { EscalationController } from '../controllers/escalationcontroller';

const router = express.Router();

// Get all escalations (paginated)
router.get('/escalations', EscalationController.getEscalations);

// Get all escalations (unpaginated for client filtering)
router.get('/escalations/all', EscalationController.getAllEscalations);

// Create a new escalation
router.post('/escalations', EscalationController.createEscalation);

// Delete an escalation
router.delete('/escalations/:id', EscalationController.deleteEscalation);

// Update status
router.patch('/escalations/:id/status', EscalationController.updateStatus);

export default router;
