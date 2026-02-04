import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express, { type Request, type Response } from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import conversationRoutes from './routes/conversationRoutes';
import escalationRoutes from './routes/escalationRoutes';
import knowledgeRoutes from './routes/knowledgeRoutes';
import statsRoutes from './routes/statsRoutes';
import widgetSettingsRoutes from './routes/widgetSettingsRoutes';
import vertexAIRag from './services/vertexAIRagService';

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000');

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/widget.js', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../public/widget.js'));
});

app.get('/admin/login', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

app.get('/admin', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

app.use(authRoutes);
app.use(chatRoutes);
app.use(knowledgeRoutes);
app.use('/api', conversationRoutes);
app.use('/api', escalationRoutes);
app.use(statsRoutes);
app.use(widgetSettingsRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

import firebaseService from './services/firebaseService';

const startServer = async () => {
  try {
    console.log('\n🔧 Initializing Vertex AI RAG Service...');
    await vertexAIRag.initialize();
    
    try {
      await firebaseService.initialize();
    } catch (error: any) {
      console.warn('⚠️  Firebase initialization warning:', error.message);
      console.log('💡 Tip: Ensure Firestore API is enabled in your GCP project');
      console.log('💡 Tip: Ensure your Firebase credentials are properly configured');
    }
    
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
