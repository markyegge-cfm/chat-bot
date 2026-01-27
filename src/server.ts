// Load environment variables FIRST (before any other imports)
import dotenv from 'dotenv';
dotenv.config();

// Then import everything else
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import conversationRoutes from './routes/conversationRoutes';
import escalationRoutes from './routes/escalationRoutes';
import knowledgeRoutes from './routes/knowledgeRoutes';
import vertexAIRag from './services/vertexAIRagService';

const app: any = express();
const PORT: number = parseInt(process.env.PORT || '3000');

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req: Request, res: Response) => {
  (res as any).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// WIDGET ENDPOINT
// ============================================
app.get('/widget.js', (req: Request, res: Response) => {
  (res as any).setHeader('Content-Type', 'application/javascript');
  (res as any).sendFile(path.join(__dirname, '../public/widget.js'));
});

// ============================================
// ADMIN LOGIN
// ============================================
app.get('/admin/login', (req: Request, res: Response) => {
  (res as any).sendFile(path.join(__dirname, '../public/admin/login.html'));
});

// ============================================
// ADMIN DASHBOARD
// ============================================
app.get('/admin', (req: Request, res: Response) => {
  (res as any).sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// ============================================
// ROUTE MOUNTING
// ============================================
app.use(authRoutes);
app.use(chatRoutes);
app.use(knowledgeRoutes);
app.use('/api', conversationRoutes);
app.use('/api', escalationRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req: any, res: any) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// ============================================
// START SERVER
// ============================================
import firebaseService from './services/firebaseService';

const startServer = async () => {
  try {
    // Initialize Vertex AI RAG Service
    console.log('\n🔧 Initializing Vertex AI RAG Service...');
    await vertexAIRag.initialize();
    
    // Initialize Firebase Service (non-blocking - continue if it fails)
    try {
      await firebaseService.initialize();
    } catch (error: any) {
      console.warn('⚠️  Firebase initialization warning:', error.message);
      console.log('💡 Tip: Ensure Firestore API is enabled in your GCP project');
      console.log('💡 Tip: Ensure your Firebase credentials are properly configured');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/admin`);
      console.log(`🧪 Test widget: http://localhost:${PORT}`);
      console.log(`✅ Server ready - Knowledge Base operational\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
