/**
 * Conversation Service
 * Manages chat conversation sessions and persistence in Firestore
 */

import admin from 'firebase-admin';
import firebaseService from './firebaseService';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface ConversationSession {
  id: string;
  userId: string;
  sessionId: string;
  startedAt: string;
  lastMessageAt: string;
  status: 'active' | 'closed' | 'escalated';
  messages: Message[];
  topic?: string;
  summary?: string;
}

class ConversationService {
  private db: admin.firestore.Firestore | null = null;

  async initialize(): Promise<void> {
    if (firebaseService.isInitialized()) {
      await firebaseService.initialize();
    }
  }

  /**
   * Get the Firestore database instance from firebaseService
   */
  private async getDb(): Promise<admin.firestore.Firestore> {
    let db = firebaseService.getDb();
    if (!db) {
      await firebaseService.initialize();
      db = firebaseService.getDb();
    }
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    return db;
  }

  /**
   * Create a new conversation session
   */
  async createSession(userId: string, sessionId: string): Promise<ConversationSession> {
    try {
      const db = await this.getDb();
      const conversationRef = db.collection('conversations').doc(sessionId);

      const session: ConversationSession = {
        id: sessionId,
        userId,
        sessionId,
        startedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        status: 'active',
        messages: [],
        topic: 'General Inquiry',
      };

      await conversationRef.set(session);
      console.log(`✅ Conversation session created: ${sessionId}`);

      return session;
    } catch (error: any) {
      // If NOT_FOUND error, Firestore API might not be enabled
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        console.warn('[Conversation] Firestore collection not available - will skip conversation storage');
        throw error;
      }
      console.error('Failed to create conversation session:', error.message);
      throw error;
    }
  }

  /**
   * Add a message to a conversation session
   */
  async addMessage(
    sessionId: string,
    sender: 'user' | 'bot',
    content: string
  ): Promise<Message> {
    try {
      // Use the Firebase service's initialized DB instance
      let db = firebaseService.getDb();
      if (!db) {
        await firebaseService.initialize();
        db = firebaseService.getDb();
      }
      
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const conversationRef = db.collection('conversations').doc(sessionId);

      const message: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender,
        content,
        timestamp: new Date().toISOString(),
      };

      // Add message to the messages array
      await conversationRef.update({
        messages: admin.firestore.FieldValue.arrayUnion(message),
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[Conversation] Message added to ${sessionId} from ${sender}`);
      return message;
    } catch (error: any) {
      // If NOT_FOUND error, Firestore collection might not exist
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        console.warn('[Conversation] Firestore collection not available - skipping message save');
        throw error;
      }
      console.error('Failed to add message:', error.message);
      throw error;
    }
  }

  /**
   * Get a conversation session by ID
   */
  async getSession(sessionId: string): Promise<ConversationSession | null> {
    try {
      const db = await this.getDb();
      const doc = await db.collection('conversations').doc(sessionId).get();

      if (!doc.exists) return null;

      return doc.data() as ConversationSession;
    } catch (error: any) {
      // If NOT_FOUND error, collection doesn't exist yet - that's okay
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        return null;
      }
      console.error('Failed to get conversation session:', error.message);
      return null;
    }
  }

  /**
   * Get all conversation sessions (for admin dashboard)
   */
  async getAllSessions(limit: number = 50): Promise<ConversationSession[]> {
    try {
      const db = await this.getDb();
      const snapshot = await db
        .collection('conversations')
        .orderBy('lastMessageAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as ConversationSession);
    } catch (error: any) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  /**
   * Get conversations with pagination
   */
  async getSessionsPaginated(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ conversations: ConversationSession[]; total: number }> {
    try {
      const db = await this.getDb();
      
      // Get total count
      const countSnapshot = await db.collection('conversations').count().get();
      const total = countSnapshot.data().count;

      // Get paginated results
      const offset = (page - 1) * pageSize;
      const snapshot = await db
        .collection('conversations')
        .orderBy('lastMessageAt', 'desc')
        .offset(offset)
        .limit(pageSize)
        .get();

      const conversations = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          lastMessage: data.messages?.[data.messages.length - 1]?.content || 'No messages',
          messageCount: data.messages?.length || 0,
        } as ConversationSession & { lastMessage: string; messageCount: number };
      });

      return { conversations, total };
    } catch (error: any) {
      console.error('Failed to get paginated conversations:', error);
      return { conversations: [], total: 0 };
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(sessionId: string): Promise<Message[]> {
    try {
      const db = await this.getDb();
      const doc = await db.collection('conversations').doc(sessionId).get();

      if (!doc.exists) return [];

      return doc.data()?.messages || [];
    } catch (error: any) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Update conversation status (escalate, close, etc.)
   */
  async updateStatus(
    sessionId: string,
    status: 'active' | 'closed' | 'escalated'
  ): Promise<void> {
    try {
      const db = await this.getDb();
      await db.collection('conversations').doc(sessionId).update({ status });
      console.log(`[Conversation] Status updated to ${status} for ${sessionId}`);
    } catch (error: any) {
      console.error('Failed to update conversation status:', error);
      throw error;
    }
  }

  /**
   * Update conversation summary/topic
   */
  async updateSessionMetadata(
    sessionId: string,
    metadata: { topic?: string; summary?: string }
  ): Promise<void> {
    try {
      const db = await this.getDb();
      await db.collection('conversations').doc(sessionId).update(metadata);
    } catch (error: any) {
      console.error('Failed to update session metadata:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation (archive)
   */
  async archiveSession(sessionId: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.collection('conversations').doc(sessionId).update({
        status: 'closed',
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Failed to archive conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversations by status
   */
  async getConversationsByStatus(
    status: 'active' | 'closed' | 'escalated',
    limit: number = 50
  ): Promise<ConversationSession[]> {
    try {
      const db = await this.getDb();
      const snapshot = await db
        .collection('conversations')
        .where('status', '==', status)
        .orderBy('lastMessageAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as ConversationSession);
    } catch (error: any) {
      console.error('Failed to get conversations by status:', error);
      return [];
    }
  }
}

export const conversationService = new ConversationService();
export default conversationService;
