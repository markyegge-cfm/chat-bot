/**
 * Firebase Service
 * Stores knowledge base metadata (Q&A pairs) in Firestore.
 * Vertex AI RAG stores the actual document content for semantic search.
 */

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

interface KnowledgeMetadata {
  id: string;
  ragFileId: string;
  ragFileIds?: string[]; // All versions of this knowledge item
  gcsUris?: string[]; // GCS URIs for all RAG files (for deletion)
  question: string;
  answer: string;
  type: 'manual' | 'csv' | 'pdf' | 'docx';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  fileUrl?: string;
}

export interface Escalation {
  id: string;
  user: string;
  question: string;
  sessionId: string;
  date: string;
  status: 'open' | 'resolved';
}

interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'editor';
}

class FirebaseService {
  private db: admin.firestore.Firestore | null = null;
  private auth: admin.auth.Auth | null = null;
  private bucket: any | null = null;
  private initialized: boolean = false;
  private databaseId: string = process.env.FIRESTORE_DATABASE_ID || 'chatbot-rag';

  /**
   * Initialize Firebase Admin SDK using Application Default Credentials.
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

      this.db = getFirestore(this.databaseId);

      this.db.settings({ ignoreUndefinedProperties: true });

      this.auth = getAuth();

      const bucketName = process.env.STORAGE_BUCKET || `${process.env.PROJECT_ID}.appspot.com`;
      console.log(`🪣 Initializing Storage bucket: ${bucketName}`);
      this.bucket = admin.storage().bucket(bucketName);

      try {
        const [exists] = await this.bucket.exists();
        if (!exists) {
          console.log(`⚠️  Bucket ${bucketName} does not exist. Attempting to create...`);
          try {
            await this.bucket.create({ location: process.env.LOCATION || 'us-central1' });
            console.log(`✅ Created bucket: ${bucketName}`);
          } catch (e: any) {
            console.warn(`❌ Failed to create bucket ${bucketName}: ${e.message}`);
          }
        }
      } catch (e) {
        console.warn(`⚠️  Could not check bucket existence: ${e}`);
      }

      this.initialized = true;

      console.log(`✅ Firebase Service initialized for database: ${this.databaseId}`);
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized.
   */
  isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  /**
   * Get the Firestore instance for use by other services.
   */
  getDb(): admin.firestore.Firestore | null {
    return this.db;
  }

  /**
   * Verify Admin Token.
   * Decodes the ID Token and validates user credentials.
   */
  async verifyAdminToken(idToken: string): Promise<AdminUser> {
    if (!this.auth) {
      await this.initialize();
    }

    try {
      const decodedToken = await this.auth!.verifyIdToken(idToken);
      const { email, uid } = decodedToken;

      return {
        uid,
        email: email || 'anonymous',
        role: 'admin'
      };

    } catch (error) {
      console.error('Auth Verification Failed:', error);
      throw new Error('Unauthorized');
    }
  }

  /**
   * Search cache for a previously answered question within the same session.
   * Session-aware caching: Same user asking same question gets cached answer.
   * Different users asking same question get separate cache entries.
   * 
   * @param question - The current user question
   * @param sessionId - The session ID to scope the cache
   * @returns Cached answer if found for this session+question, null otherwise
   */
  async getCachedAnswer(question: string, sessionId: string): Promise<string | null> {
    if (!this.db) await this.initialize();

    try {
      const sanitizedQ = question.trim().toLowerCase();
      
      // Don't cache conversational/memory questions
      const memoryKeywords = ['what was', 'what did i', 'my first', 'my previous', 'earlier', 'before'];
      if (memoryKeywords.some(keyword => sanitizedQ.includes(keyword))) {
        console.log('⏭️  Skipping cache for memory/conversational question');
        return null;
      }
      
      const snapshot = await this.db!
        .collection('artifacts')
        .doc(process.env.PROJECT_ID || 'default')
        .collection('public')
        .doc('data')
        .collection('chat_cache')
        .where('question', '==', sanitizedQ)
        .where('sessionId', '==', sessionId)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const cacheData = snapshot.docs[0].data();
      console.log(`✅ Cache HIT for session: ${sessionId.substring(0, 20)}...`);
      return cacheData.answer;
    } catch (error) {
      console.error('Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Save a new Q&A pair to the session-scoped cache.
   * Only caches knowledge-based answers (not conversational/fallback/memory responses).
   * 
   * @param question - The user's question
   * @param answer - The AI's answer
   * @param sessionId - The session ID to scope the cache
   * @param shouldCache - Whether this answer should be cached
   */
  async saveToCache(
    question: string, 
    answer: string, 
    sessionId: string,
    shouldCache: boolean = true
  ): Promise<void> {
    if (!this.db) await this.initialize();
    
    // Don't cache if explicitly disabled or answer is too short (likely conversational)
    if (!shouldCache || answer.length < 50) {
      console.log(`⏭️  Skipping cache save (shouldCache: ${shouldCache}, length: ${answer.length})`);
      return;
    }

    try {
      const sanitizedQ = question.trim().toLowerCase();
      const appId = process.env.PROJECT_ID || 'default';
      
      // Don't cache conversational/memory questions
      const memoryKeywords = ['what was', 'what did i', 'my first', 'my previous', 'earlier', 'before'];
      if (memoryKeywords.some(keyword => sanitizedQ.includes(keyword))) {
        console.log('⏭️  Skipping cache for memory/conversational question');
        return;
      }

      await this.db!
        .collection('artifacts')
        .doc(appId)
        .collection('public')
        .doc('data')
        .collection('chat_cache')
        .add({
          question: sanitizedQ,
          answer: answer,
          sessionId: sessionId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log(`💾 Cached answer for session: ${sessionId.substring(0, 20)}...`);
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  /**
   * Clear all cached responses to ensure fresh answers after knowledge updates.
   * Called when new knowledge is added or existing knowledge is updated.
   */
  async clearAllCache(): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      const appId = process.env.PROJECT_ID || 'default';
      const cacheRef = this.db!
        .collection('artifacts')
        .doc(appId)
        .collection('public')
        .doc('data')
        .collection('chat_cache');

      const snapshot = await cacheRef.get();
      
      if (snapshot.empty) {
        console.log('✅ Cache already empty');
        return;
      }

      const batch = this.db!.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Cleared ${snapshot.size} cached responses`);
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Save knowledge metadata to Firestore.
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
   * Get all knowledge items.
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
   * Upload PDF file to Firebase Storage
   * Returns the public download URL
   */
  async uploadPdfFile(fileBuffer: Buffer, filename: string, knowledgeId: string): Promise<string> {
    if (!this.bucket) await this.initialize();

    const filePath = `pdfs/${knowledgeId}/${filename}`;
    console.log(`📁 Uploading PDF to: ${filePath}`);
    console.log(`🪣 Bucket name: ${this.bucket!.name}`);

    try {
      const file = this.bucket!.file(filePath);

      // Upload file
      await file.save(fileBuffer, {
        metadata: {
          contentType: 'application/pdf',
          custom: {
            knowledgeId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      console.log(`✅ File saved to Firebase Storage`);

      // Try to generate a signed URL, but don't fail if we can't
      // (Application Default Credentials don't support signing)
      try {
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        console.log(`✅ Generated signed URL for file access`);
        return signedUrl;
      } catch (signError: any) {
        // If signing fails (no service account), return a basic GCS path
        // The file is still saved, just not accessible via signed URL
        console.warn(`⚠️  Could not generate signed URL (expected with ADC): ${signError.message}`);
        const gcsPath = `gs://${this.bucket!.name}/${filePath}`;
        console.log(`📍 File stored at: ${gcsPath}`);
        return gcsPath;
      }
    } catch (error) {
      console.error(`❌ Error uploading PDF to Firebase Storage:`, error);
      throw error;
    }
  }

  /**
   * Delete uploaded file (PDF/DOCX) from Firebase Storage
   */
  async deletePdfFile(knowledgeId: string): Promise<void> {
    if (!this.bucket) await this.initialize();

    try {
      // Get all files in the knowledge directory
      const [files] = await this.bucket!.getFiles({ prefix: `pdfs/${knowledgeId}/` });

      if (files.length === 0) {
        console.log(`ℹ️  No storage files found for knowledge: ${knowledgeId}`);
        return;
      }

      // Delete all files
      const deletePromises = files.map((file: any) => file.delete());
      await Promise.all(deletePromises);

      console.log(`✅ Deleted ${files.length} storage file(s) for knowledge: ${knowledgeId}`);
    } catch (error: any) {
      console.warn(`⚠️  Could not delete storage files for ${knowledgeId}:`, error.message);
    }
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

  /**
   * Get detailed statistics for the knowledge base
   */
  async getDetailedStats(): Promise<any> {
    if (!this.db) await this.initialize();

    try {
      const snapshot = await this.db!.collection('knowledge').get();
      const files = snapshot.docs.map(doc => doc.data());

      return {
        totalFiles: files.length,
        byType: {
          manual: files.filter(f => f.type === 'manual').length,
          csv: files.filter(f => f.type === 'csv').length,
          pdf: files.filter(f => f.type === 'pdf').length,
          docx: files.filter(f => f.type === 'docx').length,
        }
      };
    } catch (error: any) {
      console.error('Failed to get detailed stats:', error);
      return { totalFiles: 0, byType: { manual: 0, csv: 0, pdf: 0, docx: 0 } };
    }
  }

  /**
   * Start a new conversation session.
   */
  async startConversation(sessionId: string): Promise<void> {
    if (!this.db) await this.initialize();

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    await this.db!.collection('conversations').doc(sessionId).set({
      id: sessionId,
      title: `Chat on ${dateStr} at ${timeStr}`, // descriptive default title
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionId}`,
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

    // Get current conversation to check for title
    const convRef = this.db!.collection('conversations').doc(sessionId);
    const convDoc = await convRef.get();
    const convData = convDoc.data();

    const updateData: any = {
      lastMessage: content.substring(0, 100),
      updatedAt: timestamp,
      messageCount: admin.firestore.FieldValue.increment(1),
    };

    // If it's the first user message, update the title with the message content
    if (sender === 'user' && (!convData || !convData.title || convData.title.startsWith('Visitor'))) {
      updateData.title = content.substring(0, 40) + (content.length > 40 ? '...' : '');
    }

    // Update conversation metadata
    await convRef.set(updateData, { merge: true });
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

  /**
   * Create a new escalation record.
   */
  async createEscalation(data: Omit<Escalation, 'id' | 'date'>): Promise<string> {
    if (!this.db) await this.initialize();

    const timestamp = new Date().toISOString();

    try {
      const docRef = await this.db!.collection('escalations').add({
        ...data,
        date: timestamp,
        status: 'open',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return docRef.id;
    } catch (error: any) {
      console.error('Failed to create escalation:', error);
      throw error;
    }
  }

  async getAllEscalations(): Promise<Escalation[]> {
    if (!this.db) await this.initialize();

    try {
      const snapshot = await this.db!
        .collection('escalations')
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Escalation;
      });
    } catch (error: any) {
      console.error('Failed to fetch all escalations:', error);
      if (error.code === 5) return [];
      throw error;
    }
  }

  /**
   * Get escalations with pagination
   */
  async getEscalations(page: number = 1, limit: number = 20, status?: string, search?: string): Promise<{ escalations: Escalation[], total: number }> {
    if (!this.db) await this.initialize();

    try {
      let query: admin.firestore.Query = this.db!.collection('escalations');

      if (status && status !== 'all') {
        query = query.where('status', '==', status);
      }

      // Note: Full-text search in Firestore is limited. 
      // For simple search, we'll fetch then filter or just do simple prefix if possible.
      // But for this requirement, we'll apply prefix search on 'user' or just fetch all and filter in memory if they are not too many.
      // Sinc // No longer using local cachee we need pagination, searching in Firestore is better.
      // However, Firestore doesn't support multiple OR conditions across different fields easily without composite indexes or external search.

      // Let's stick to status filter for now and maybe handle search by fetching more or if it's user email.

      const countSnapshot = await query.count().get();
      const total = countSnapshot.data().count;

      const skip = (page - 1) * limit;
      const snapshot = await query
        .orderBy('date', 'desc')
        .limit(limit)
        .offset(skip)
        .get();

      let escalations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user: data.user,
          question: data.question,
          sessionId: data.sessionId,
          date: data.date,
          status: data.status
        } as Escalation;
      });

      // Simple in-memory search for the current page result (not ideal for global search across pages)
      // To do properly, we'd need Algolia or similar, or a more complex query.
      if (search) {
        const s = search.toLowerCase();
        // If we want global search, we'd have to change how we fetch.
        // For now, let's at least support what's returned.
        // OR better: if search is provided, we might fetch more and then paginate in memory if it's small scale.
      }

      return { escalations, total };
    } catch (error: any) {
      console.error('Failed to fetch escalations:', error);
      if (error.code === 5) return { escalations: [], total: 0 };
      throw error;
    }
  }
  /**
   * Delete an escalation
   */
  async deleteEscalation(id: string): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.collection('escalations').doc(id).delete();
  }

  /**
   * Update escalation status
   */
  async updateEscalationStatus(id: string, status: 'open' | 'resolved'): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.collection('escalations').doc(id).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
