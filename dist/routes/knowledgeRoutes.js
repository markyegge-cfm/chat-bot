"use strict";
/**
 * Knowledge Base Routes
 * API endpoints for managing Q&A knowledge base
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const knowledgeController_1 = require("../controllers/knowledgeController");
const router = (0, express_1.Router)();
// Get all knowledge items
router.get('/api/knowledge', knowledgeController_1.getAllKnowledge);
// Get knowledge statistics
router.get('/api/knowledge/stats', knowledgeController_1.getKnowledgeStats);
// Get single knowledge item
router.get('/api/knowledge/:id', knowledgeController_1.getKnowledgeById);
// Create manual Q&A entry
router.post('/api/knowledge', knowledgeController_1.createKnowledge);
// Update knowledge item
router.put('/api/knowledge/:id', knowledgeController_1.updateKnowledge);
// Delete knowledge item
router.delete('/api/knowledge/:id', knowledgeController_1.deleteKnowledge);
// Upload CSV
router.post('/api/knowledge/upload/csv', knowledgeController_1.uploadCSV);
// Debug: Check RAG status
router.get('/api/knowledge/debug/rag-status', async (req, res) => {
    try {
        const vertexAIRag = await Promise.resolve().then(() => __importStar(require('../services/vertexAIRagService'))).then(m => m.default);
        const isInitialized = vertexAIRag.isInitialized?.();
        const config = vertexAIRag.getConfig?.();
        res.json({
            success: true,
            initialized: isInitialized,
            config: config,
            message: isInitialized
                ? 'GCP Vertex AI RAG is initialized and ready'
                : 'GCP Vertex AI RAG is NOT initialized - check logs',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
