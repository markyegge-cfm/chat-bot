# RAG-Powered Chatbot with LangGraph

An intelligent chatbot system powered by Google Vertex AI RAG Engine and LangGraph, featuring a comprehensive admin dashboard for knowledge base management.

## 🚀 Features

### Phase 1 - Foundation ✅
- ✅ Mobile-responsive chatbot widget
- ✅ Admin authentication system
- ✅ Admin dashboard with Knowledge Base & Escalations
- ✅ Manual Q&A entry system
- ✅ CSV batch upload (question,answer format)
- ✅ Edit/Delete knowledge items
- ✅ Search and pagination

### Phase 2 - RAG Integration 🔄 (Current)
- 🔄 Google Vertex AI RAG Corpus integration
- 🔄 Automatic knowledge base synchronization
- 🔄 Real-time document retrieval from RAG Engine
- 📅 Coming: PDF/DOCX document processing
- 📅 Coming: LangGraph workflow orchestration

## 📦 Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **AI/ML:** Google Vertex AI, RAG Engine
- **Storage:** Google Cloud Storage, Firebase (planned)

### Frontend
- **Framework:** Vanilla JavaScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom admin dashboard

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Project with Vertex AI enabled
- Service account with RAG Engine permissions

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rag-langGraph
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Google Cloud credentials:
   ```env
   # Google Cloud Configuration
   LOCATION=us-west1
   ENDPOINT_URL=https://chat-bot-service-767432724134.us-west1.run.app
   
   # RAG Engine
   CORPUS_NAME=cash-flow-chat-bot
   RESOURCE_NAME=projects/project-48500cc0-09cc-40c8-8e8/locations/us-west1/ragCorpora/4532873024948404224
   PROJECT_ID=project-48500cc0-09cc-40c8-8e8
   
   # Service Account
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   ```

4. **Add Google Cloud Service Account Key**
   - Download your service account JSON key from Google Cloud Console
   - Save it as `service-account-key.json` in the project root
   - Ensure the service account has these roles:
     - Vertex AI User
     - RAG Corpus Admin

5. **Build and start**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## 🌐 API Endpoints

### Knowledge Base Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge` | List all knowledge items |
| POST | `/api/knowledge` | Create manual Q&A |
| PUT | `/api/knowledge/:id` | Update knowledge item |
| DELETE | `/api/knowledge/:id` | Delete knowledge item |
| POST | `/api/knowledge/upload/csv` | Batch upload CSV |
| GET | `/api/knowledge/stats` | Get statistics |

### Example: Create Knowledge Item
```bash
curl -X POST http://localhost:3000/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is RAG?",
    "answer": "RAG stands for Retrieval-Augmented Generation...",
    "type": "manual"
  }'
```

### Example: CSV Upload
```bash
curl -X POST http://localhost:3000/api/knowledge/upload/csv \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"question": "Q1?", "answer": "A1"},
      {"question": "Q2?", "answer": "A2"}
    ]
  }'
```

## 📊 RAG Engine Integration

### How It Works

1. **Knowledge Ingestion**
   - When you add Q&A through the admin panel (manual or CSV)
   - Data is stored in memory AND sent to Google Vertex AI RAG Corpus
   - RAG Engine automatically indexes the content for semantic search

2. **Query Processing**
   - User asks a question via the chatbot widget
   - System queries the RAG Corpus for relevant context
   - LangGraph orchestrates the retrieval and response generation
   - Google Gemini generates the final response using retrieved context

3. **Benefits**
   - ✅ Semantic search (understands meaning, not just keywords)
   - ✅ Scalable to millions of documents
   - ✅ Automatic embedding and indexing
   - ✅ Real-time updates without retraining

### RAG Service Architecture

```typescript
// Import knowledge to RAG Corpus
await ragEngine.importItem({
  question: "How do I reset my password?",
  answer: "Click on 'Forgot Password' and follow the instructions...",
  type: "manual"
});

// Query RAG for relevant context
const contexts = await ragEngine.query("password reset", 5);

// Batch import from CSV
await ragEngine.importBatch(csvItems);
```

## 🎨 Admin Dashboard

Access at: `http://localhost:3000/admin`

### Features
- **Knowledge Base Tab**
  - View all Q&A pairs in a table
  - Search by question or answer
  - Pagination (8, 16, 24 items per page)
  - Add manually or via CSV upload
  - Edit/Delete actions

- **Escalations Tab**
  - View user queries escalated by the chatbot
  - Filter by confidence level
  - Review and respond

## 📝 CSV Upload Format

The system accepts CSV files with the following format:

```csv
question,answer
"What is your refund policy?","We offer a 30-day money-back guarantee..."
"How do I track my order?","Login to your account and visit the Orders page..."
```

**Requirements:**
- Headers must be: `question,answer`
- Both columns are required
- Minimum 3 characters for question and answer
- UTF-8 encoding recommended

## 🔐 Security Notes

⚠️ **Important:**
- Never commit `.env` or `service-account-key.json` to version control
- These files are already in `.gitignore`
- Rotate service account keys regularly
- Use least-privilege IAM roles

## 🚧 Development Roadmap

### Phase 3 - LangGraph Workflows
- [ ] Multi-step reasoning workflows
- [ ] Conversation state management
- [ ] Context-aware follow-up questions

### Phase 4 - Advanced Features
- [ ] PDF document parsing and chunking
- [ ] DOCX file support
- [ ] Multimodal support (images, tables)
- [ ] Analytics dashboard
- [ ] A/B testing for responses

## 📄 License

ISC

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
