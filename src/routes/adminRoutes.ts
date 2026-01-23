/**
 * Admin Routes - Routes for admin dashboard and management
 */

import { Router } from 'express';
import { AdminController } from '../controllers/adminController';

const router = Router();

/**
 * POST /api/admin/login
 * Admin login endpoint
 */
router.post('/api/admin/login', AdminController.login);

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/api/admin/dashboard', AdminController.getDashboardStats);

/**
 * GET /api/admin/conversations
 * Get list of conversations
 */
router.get('/api/admin/conversations', AdminController.getConversations);

/**
 * GET /api/admin/conversations/:id/messages
 * Get messages for a specific conversation
 */
router.get('/api/admin/conversations/:id/messages', AdminController.getConversationMessages);

/**
 * GET /api/admin/escalations
 * Get list of escalations
 */
router.get('/api/admin/escalations', AdminController.getEscalations);

/**
 * POST /api/admin/documents/upload
 * Upload document for knowledge base
 */
router.post('/api/admin/documents/upload', AdminController.uploadDocument);

export default router;
