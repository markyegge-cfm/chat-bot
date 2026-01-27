/**
 * Escalation Routes
 * API endpoints for managing escalation tickets
 */

import express from 'express';
import { EscalationController } from '../controllers/escalationcontroller';

const router = express.Router();

// Get all escalations (paginated)
router.get('/escalations', EscalationController.getEscalations);

// Create a new escalation
router.post('/escalations', EscalationController.createEscalation);

export default router;
