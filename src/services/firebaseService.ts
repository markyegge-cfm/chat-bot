/**
 * Firebase Service
 * Stores knowledge base metadata (Q&A pairs) in Firestore
 * while Vertex AI RAG stores the actual document content for semantic search
 */

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

interface KnowledgeMetadata {
  id: string;
  ragFileId: string; // ID from Vertex AI RAG
  question: string;
  answer: string;
  type: 'manual' | 'csv' | 'pdf' | 'docx';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

// Define the Admin User structure
interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'editor';
}

class FirebaseService {
  private db: admin.firestore.Firestore | null = null;
  private auth: admin.auth.Auth | null = null;
  private initialized: boolean = false;
  // Fallback to 'chatbot-rag' if FIRESTORE_DATABASE_ID is not in .env
  private databaseId: string = process.env.FIRESTORE_DATABASE_ID || 'chatbot-rag';

  /**
   * Initialize Firebase Admin SDK
   * Uses Application Default Credentials (same as Vertex AI)
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        return;
      }

      console.log('\n🔥 Initializing Firebase Service...');
      console.log(`Target Project: ${process.env.PROJECT_ID}`);
      console.log(`Target Database: ${this.databaseId}`);

      // Initialize Firebase Admin with ADC (same auth as Vertex AI)
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.PROJECT_ID,
        });
      }

      /**
       * CRITICAL FIX: Explicitly target the named database.
       * If your database in GCP is named 'chitbot-rag', calling admin.firestore() 
       * without arguments will look for '(default)' and return a NOT_FOUND error.
       */
      this.db = getFirestore(this.databaseId);
      
      // Enable ignoreUndefinedProperties to handle cases where fields might be undefined
      this.db.settings({ ignoreUndefinedProperties: true });
      
      // Initialize Auth
      this.auth = getAuth();
      
      this.initialized = true;

      console.log(`✅ Firebase Service initialized for database: ${this.databaseId}`);
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  /**
   * Get the Firestore instance (for use by other services)
   */
  getDb(): admin.firestore.Firestore | null {
    return this.db;
  }

  /**
   * 🔐 Verify Admin Token
   * 1. Decodes the ID Token sent from Frontend
   * 2. Checks if the user exists in the 'admins' Firestore collection
   */
  async verifyAdminToken(idToken: string): Promise<AdminUser> {
    if (!this.auth || !this.db) {
      await this.initialize();
    }

    try {
      // 1. Verify the integrity of the token with Firebase Auth
      const decodedToken = await this.auth!.verifyIdToken(idToken);
      const { email, uid } = decodedToken;

      // 2. Check Authorization: Is this user in our 'admins' collection?
      let adminDoc = await this.db!.collection('admins').doc(uid).get();
      
      if (!adminDoc.exists && email) {
        const emailQuery = await this.db!.collection('admins').where('email', '==', email).limit(1).get();
        if (!emailQuery.empty) {
          adminDoc = emailQuery.docs[0];
        }
      }

      if (!adminDoc.exists) {
        console.warn(`⚠️ Unauthorized access attempt by ${email} (${uid})`);
        throw new Error('Unauthorized: User is not in the admins list');
      }

      const data = adminDoc.data();
      return { 
        uid, 
        email: email!, 
        role: data?.role || 'admin' 
      };

    } catch (error) {
      console.error('Auth Verification Failed:', error);
      throw new Error('Unauthorized');
    }
  }

  /**
   * Search cache for a previously answered identical question
   */
  async getCachedAnswer(question: string): Promise<string | null> {
    if (!this.db) await this.initialize();
    
    try {
      const sanitizedQ = question.trim().toLowerCase();
      const snapshot = await this.db!
        .collection('artifacts')
        .doc(process.env.PROJECT_ID || 'default')
        .collection('public')
        .doc('data')
        .collection('chat_cache')
        .where('question', '==', sanitizedQ)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      
      return snapshot.docs[0].data().answer;
    } catch (error) {
      console.error('Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Save a new Q&A pair to the public cache
   */
  async saveToCache(question: string, answer: string): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      const sanitizedQ = question.trim().toLowerCase();
      const appId = process.env.PROJECT_ID || 'default';
      
      await this.db!
        .collection('artifacts')
        .doc(appId)
        .collection('public')
        .doc('data')
        .collection('chat_cache')
        .add({
          question: sanitizedQ,
          answer: answer,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  /**
   * Save knowledge metadata to Firestore
   */
  async saveKnowledge(data: Omit<KnowledgeMetadata, 'id'>): Promise<KnowledgeMetadata> {
    if (!this.db) await this.initialize();

    try {
      const docRef = await this.db!.collection('knowledge').add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const doc = await docRef.get();
      const docData = doc.data();

      return {
        id: doc.id,
        ...docData,
        createdAt: docData?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: docData?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as KnowledgeMetadata;
    } catch (error: any) {
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        console.error(`❌ Firestore Database "${this.databaseId}" not found or API not enabled.`);
        return {
          id: `mock_${Math.random().toString(36).substr(2, 9)}`,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as KnowledgeMetadata;
      }
      throw error;
    }
  }

  /**
   * Get all knowledge items
   */
  async getAllKnowledge(): Promise<KnowledgeMetadata[]> {
    if (!this.db) await this.initialize();

    try {
      const snapshot = await this.db!.collection('knowledge').orderBy('createdAt', 'desc').get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      }) as KnowledgeMetadata[];
    } catch (error: any) {
      if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get knowledge by ID
   */
  async getKnowledgeById(id: string): Promise<KnowledgeMetadata | null> {
    if (!this.db) await this.initialize();

    const doc = await this.db!.collection('knowledge').doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as KnowledgeMetadata;
  }

  /**
   * Get knowledge by RAG file ID
   */
  async getKnowledgeByRagFileId(ragFileId: string): Promise<KnowledgeMetadata | null> {
    if (!this.db) await this.initialize();

    const snapshot = await this.db!.collection('knowledge').where('ragFileId', '==', ragFileId).limit(1).get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as KnowledgeMetadata;
  }

  /**
   * Update knowledge metadata
   */
  async updateKnowledge(id: string, data: Partial<KnowledgeMetadata>): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.collection('knowledge').doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Delete knowledge metadata
   */
  async deleteKnowledge(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.collection('knowledge').doc(id).delete();
  }

  /**
   * Delete knowledge by RAG file ID
   */
  async deleteKnowledgeByRagFileId(ragFileId: string): Promise<void> {
    if (!this.db) await this.initialize();

    const snapshot = await this.db!.collection('knowledge').where('ragFileId', '==', ragFileId).get();

    if (snapshot.empty) return;

    const batch = this.db!.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  /**
   * Get knowledge count
   */
  async getKnowledgeCount(): Promise<number> {
    if (!this.db) await this.initialize();

    try {
      const snapshot = await this.db!.collection('knowledge').count().get();
      return snapshot.data().count;
    } catch (error: any) {
      if (error.code === 5) return 0;
      throw error;
    }
  }

  // ============================================
  // CONVERSATION METHODS
  // ============================================

  /**
   * Start a new conversation session
   */
  async startConversation(sessionId: string, userIdentifier?: string): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.collection('conversations').doc(sessionId).set({
      id: sessionId,
      userId: userIdentifier || 'anonymous',
      status: 'active',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      messageCount: 0,
      lastMessage: '',
    });
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(sessionId: string, sender: 'user' | 'assistant', content: string): Promise<void> {
    if (!this.db) await this.initialize();

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    // Add message to subcollection
    await this.db!.collection('conversations')
      .doc(sessionId)
      .collection('messages')
      .add({
        sender,
        content,
        timestamp,
      });

    // Update conversation metadata
    await this.db!.collection('conversations').doc(sessionId).update({
      lastMessage: content.substring(0, 100),
      updatedAt: timestamp,
      messageCount: admin.firestore.FieldValue.increment(1),
    });
  }

  /**
   * Get all conversations (with pagination)
   */
  async getAllConversations(page: number = 1, limit: number = 50): Promise<any[]> {
    if (!this.db) await this.initialize();

    try {
      const skip = (page - 1) * limit;
      const snapshot = await this.db!
        .collection('conversations')
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .offset(skip)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error: any) {
      if (error.code === 5) return [];
      throw error;
    }
  }

  /**
   * Get a specific conversation
   */
  async getConversation(sessionId: string): Promise<any> {
    if (!this.db) await this.initialize();

    try {
      const doc = await this.db!.collection('conversations').doc(sessionId).get();
      if (!doc.exists) return null;

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error: any) {
      if (error.code === 5) return null;
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(sessionId: string): Promise<any[]> {
    if (!this.db) await this.initialize();

    try {
      const snapshot = await this.db!
        .collection('conversations')
        .doc(sessionId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error: any) {
      if (error.code === 5) return [];
      throw error;
    }
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(sessionId: string, status: string): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.collection('conversations').doc(sessionId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Get conversations by status
   */
  async getConversationsByStatus(status: string, limit: number = 50): Promise<any[]> {
    if (!this.db) await this.initialize();

    try {
      const snapshot = await this.db!
        .collection('conversations')
        .where('status', '==', status)
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error: any) {
      if (error.code === 5) return [];
      throw error;
    }
  }

  /**
   * Get conversation count
   */
  async getConversationCount(): Promise<number> {
    if (!this.db) await this.initialize();

    try {
      const snapshot = await this.db!.collection('conversations').count().get();
      return snapshot.data().count;
    } catch (error: any) {
      if (error.code === 5) return 0;
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;