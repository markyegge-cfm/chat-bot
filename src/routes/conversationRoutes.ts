/**
 * Conversation Routes
 * API endpoints for managing conversation sessions
 */

import express from 'express';
import { ConversationController } from '../controllers/conversationController';

const router = express.Router();

// Start a new conversation
router.post('/conversations/start', ConversationController.startConversation);

// Get all conversations (paginated) - must be before :sessionId routes
router.get('/conversations', ConversationController.getAllConversations);

// More specific routes first (with /status and /messages)
router.get('/conversations/status/:status', ConversationController.getByStatus);
router.get('/conversations/:sessionId/messages', ConversationController.getMessages);

// Generic routes last (less specific patterns)
router.get('/conversations/:sessionId', ConversationController.getConversation);

// Add a message to a conversation
router.post('/conversations/:sessionId/messages', ConversationController.addMessage);

// Update conversation status
router.patch('/conversations/:sessionId/status', ConversationController.updateStatus);

// Update conversation metadata
router.patch('/conversations/:sessionId/metadata', ConversationController.updateMetadata);

export default router;
