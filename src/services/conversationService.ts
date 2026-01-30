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
   * Get all conversation sessions (with pagination)
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
        .orderBy('updatedAt', 'desc')
        .offset(offset)
        .limit(pageSize)
        .get();

      const conversations = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          lastMessage: data.lastMessage || 'No messages',
          messageCount: data.messageCount || 0,
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
   * Messages are stored in a subcollection: conversations/{sessionId}/messages
   */
  async getMessages(sessionId: string): Promise<Message[]> {
    try {
      const db = await this.getDb();
      
      // Fetch messages from the subcollection
      const snapshot = await db
        .collection('conversations')
        .doc(sessionId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        sender: doc.data().sender,
        content: doc.data().content,
        timestamp: doc.data().timestamp?.toDate?.().toISOString() || new Date().toISOString(),
      }));
    } catch (error: any) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Delete a single conversation and its messages subcollection
   */
  async deleteConversation(sessionId: string): Promise<void> {
    try {
      const db = await this.getDb();

      // Delete all messages in subcollection in batches
      const messagesRef = db.collection('conversations').doc(sessionId).collection('messages');
      const snapshot = await messagesRef.limit(500).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      // Delete conversation document
      await db.collection('conversations').doc(sessionId).delete();
    } catch (error: any) {
      console.error(`Failed to delete conversation ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Batch delete conversations by IDs
   */
  async batchDeleteConversations(ids: string[]): Promise<void> {
    try {
      const db = await this.getDb();
      for (const id of ids) {
        await this.deleteConversation(id);
      }
    } catch (error: any) {
      console.error('Failed to batch delete conversations:', error);
      throw error;
    }
  }

  /**
   * Delete all conversations (use with caution)
   */
  async deleteAllConversations(): Promise<void> {
    try {
      const db = await this.getDb();
      const snapshot = await db.collection('conversations').get();
      for (const doc of snapshot.docs) {
        await this.deleteConversation(doc.id);
      }
    } catch (error: any) {
      console.error('Failed to delete all conversations:', error);
      throw error;
    }
  }
}

export const conversationService = new ConversationService();
export default conversationService;
