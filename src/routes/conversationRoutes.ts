/**
 * Conversation Routes
 * API endpoints for managing conversation sessions
 */

import express from 'express';
import { ConversationController } from '../controllers/conversationController';

const router = express.Router();

// Get all conversations (paginated) - Admin dashboard
router.get('/conversations', ConversationController.getAllConversations);

// Get messages for a conversation
router.get('/conversations/:sessionId/messages', ConversationController.getMessages);

// Delete a single conversation
router.delete('/conversations/:sessionId', ConversationController.deleteConversation);

// Batch delete conversations
router.post('/conversations/batch-delete', ConversationController.batchDeleteConversations);

// Delete all conversations
router.delete('/conversations', ConversationController.deleteAllConversations);

export default router;
