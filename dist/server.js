"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const knowledgeRoutes_1 = __importDefault(require("./routes/knowledgeRoutes"));
const vertexAIRagService_1 = __importDefault(require("./services/vertexAIRagService"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000');
// ============================================
// MIDDLEWARE
// ============================================
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});
// ============================================
// WIDGET ENDPOINT
// ============================================
app.get('/widget.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path_1.default.join(__dirname, '../public/widget.js'));
});
// ============================================
// ADMIN LOGIN
// ============================================
app.get('/admin/login', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/admin/login.html'));
});
// ============================================
// ADMIN DASHBOARD
// ============================================
app.get('/admin', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/admin/index.html'));
});
// ============================================
// ROUTE MOUNTING
// ============================================
app.use(chatRoutes_1.default);
app.use(knowledgeRoutes_1.default);
// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
    });
});
// ============================================
// START SERVER
// ============================================
const startServer = async () => {
    try {
        // Initialize Vertex AI RAG Service (optional - falls back to local mode)
        console.log('\n🔧 Initializing Vertex AI RAG Service...');
        await vertexAIRagService_1.default.initialize();
        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running at http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/admin`);
            console.log(`🧪 Test widget: http://localhost:${PORT}`);
            console.log(`✅ Server ready - Knowledge Base operational\n`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
