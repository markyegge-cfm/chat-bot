# Setup Guide: Vertex AI RAG Authentication

## Overview

This application uses **Google Cloud's Vertex AI RAG Engine** as the sole data store. Authentication works seamlessly in two environments:

1. **Local Development**: Uses a service account JSON key file
2. **Cloud Run**: Uses the attached service account (automatic)

## Prerequisites

- Node.js 18+ installed
- npm packages already installed (run `npm install` if needed)
- Google Cloud Project with Vertex AI RAG Engine enabled
- Service account with "Vertex AI User" role

## Local Development Setup (Required)

### Step 1: Create/Obtain Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **IAM & Admin → Service Accounts**
4. Select or create a service account
5. Go to the **Keys** tab
6. Click **Add Key → Create new key → JSON**
7. A JSON file will download automatically

### Step 2: Place Key File in Project Root

1. Save the downloaded JSON file as `service-account-key.json`
2. Place it in the project root directory:
   ```
   rag-langGraph/
   ├── service-account-key.json  ← Place here
   ├── src/
   ├── package.json
   └── .env
   ```

3. **IMPORTANT**: This file is already in `.gitignore` and will NOT be committed

### Step 3: Verify .env Configuration

Check `.env` file has these variables:

```env
PROJECT_ID=your-project-id
LOCATION=us-west1
CORPUS_NAME=your-corpus-name
ENDPOINT_URL=https://us-west1-aiplatform.googleapis.com/v1
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

Get `CORPUS_NAME` from [Vertex AI RAG Console](https://console.cloud.google.com/vertex-ai/rag)

### Step 4: Verify Service Account Permissions

The service account needs this IAM role:

- **Vertex AI User** 
  - Allows: Create, read, update, delete RAG operations
  - View: [IAM Roles Documentation](https://cloud.google.com/iam/docs/roles/vertex-ai-user)

To grant the role:

1. Go to **IAM & Admin → IAM**
2. Click **Edit principal** for your service account
3. Click **Add another role**
4. Search for "Vertex AI User"
5. Click **Save**

### Step 5: Test Locally

```bash
# Start the development server
npm run dev

# Expected output:
# Initializing Vertex AI RAG Service
#    Environment: Local Dev
#    Project: your-project-id
#    Location: us-west1
#    Corpus: your-corpus-name
#    Authenticating...
#    Using service account: service-account-key.json
#    Corpus resolved: your-corpus-id
# Vertex AI RAG ready
```

If you see errors, check the [Troubleshooting](#troubleshooting) section below.

## How Authentication Works

### Local Development

```
┌─────────────────────────────────────────┐
│ npm run dev                             │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ GOOGLE_APPLICATION_CREDENTIALS=         │
│ ./service-account-key.json              │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ GoogleAuth reads JSON key file          │
│ • Validates credentials                 │
│ • Obtains access token                  │
│ • Creates axios HTTP client             │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Authorization: Bearer {access_token}    │
│ (authenticated HTTP requests to GCP)    │
└─────────────────────────────────────────┘
```

### Cloud Run (Automatic)

```
┌─────────────────────────────────────────┐
│ Deploy to Cloud Run                     │
│ (service account attached)              │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ GoogleAuth detects Cloud Run            │
│ (K_SERVICE env var present)             │
│ • Auto-uses attached service account    │
│ • No key file needed                    │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Authorization: Bearer {access_token}    │
│ (authenticated HTTP requests to GCP)    │
└─────────────────────────────────────────┘
```

**Key Difference**: On Cloud Run, GoogleAuth automatically detects the environment and uses the attached service account. No key file is needed.

## Deployment to Cloud Run

### Step 1: Deploy the Application

```bash
# Build Docker image (if using Docker)
docker build -t gcr.io/PROJECT_ID/rag-app .

# Push to Container Registry
docker push gcr.io/PROJECT_ID/rag-app

# Or use Cloud Run directly
gcloud run deploy rag-app \
  --image gcr.io/PROJECT_ID/rag-app \
  --region us-west1 \
  --platform managed
```

### Step 2: Configure Service Account on Cloud Run

The deployed service must use a service account with **Vertex AI User** role:

```bash
gcloud run services update rag-app \
  --region us-west1 \
  --service-account=your-service-account@PROJECT_ID.iam.gserviceaccount.com
```

### Step 3: Set Environment Variables (Optional)

If you need to override .env values on Cloud Run:

```bash
gcloud run services update rag-app \
  --region us-west1 \
  --update-env-vars PROJECT_ID=project-id,LOCATION=us-west1
```

**Note**: `GOOGLE_APPLICATION_CREDENTIALS` is NOT needed on Cloud Run because GoogleAuth auto-detects the service account.

## Troubleshooting

### Error: "Service account key not found at: ./service-account-key.json"

**Cause**: The key file is missing or path is wrong.

**Solution**:
1. Download key from GCP console (see Step 1 above)
2. Save as `./service-account-key.json` in project root
3. Verify file exists: `ls -la service-account-key.json`
4. Check `.env`: `GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json`

### Error: "Authentication failed (401 Unauthorized)"

**Cause**: Service account lacks "Vertex AI User" role.

**Solution**:
1. Go to [IAM Console](https://console.cloud.google.com/iam-admin/iam)
2. Find your service account
3. Click **Edit principal**
4. Add role: **Vertex AI User**
5. Save and wait 1-2 minutes for role to propagate

### Error: "No RAG corpuses found"

**Cause**: Project doesn't have a Vertex AI RAG corpus, or corpus name is wrong.

**Solution**:
1. Go to [Vertex AI RAG Console](https://console.cloud.google.com/vertex-ai/rag)
2. Create a new corpus if needed
3. Copy exact corpus name
4. Update `.env`: `CORPUS_NAME=your-exact-name`

### Error: "Corpus 'X' not found. Available: ..."

**Cause**: The corpus name in `.env` doesn't match any created corpuses.

**Solution**:
- Use the name shown in the "Available" list
- Corpus names are case-sensitive
- Update `.env` and restart: `npm run dev`

### Server Starts But Can't Access Data

**Cause**: Possible network or API quota issues.

**Solution**:
1. Verify corpus has files: Check GCP console
2. Check quotas: [Vertex AI Quotas](https://console.cloud.google.com/apis/dashboard)
3. Enable Vertex AI API: [APIs Console](https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/overview)

## Security Best Practices

### Local Development

- ✅ `service-account-key.json` is in `.gitignore` (won't be committed)
- ✅ Never commit service account keys
- ✅ Use keys only for local testing
- ✅ Rotate keys regularly

### Cloud Run

- ✅ Uses attached service account (no key files)
- ✅ Keys stored in Cloud Secrets Manager (use for sensitive data)
- ✅ Service account permissions automatically scoped

### Production

1. **Rotate Keys**: Service account keys every 90 days
2. **Audit Logs**: Enable Cloud Audit Logs for all RAG operations
3. **Secrets**: Store sensitive values in [Cloud Secrets Manager](https://cloud.google.com/secret-manager/docs)
4. **RBAC**: Use service accounts with minimal required permissions (Vertex AI User only)

## File Structure

```
rag-langGraph/
├── service-account-key.json          ← Your service account key (in .gitignore)
├── .env                              ← Configuration (in .gitignore)
├── .gitignore                        ← Excludes service-account-*.json
├── src/
│   ├── server.ts                     ← Express server + RAG initialization
│   ├── services/
│   │   └── vertexAIRagService.ts     ← RAG client (GoogleAuth + REST)
│   ├── controllers/
│   │   ├── chatController.ts         ← Chat API endpoints
│   │   └── knowledgeController.ts    ← Knowledge base management
│   ├── routes/
│   │   ├── chatRoutes.ts
│   │   └── knowledgeRoutes.ts
│   └── middleware/
│       └── authMiddleware.ts         ← Auth for admin endpoints
└── package.json
```

## API Endpoints

### Knowledge Management

- **GET** `/api/knowledge/files` - List all uploaded files
- **POST** `/api/knowledge/upload` - Upload CSV or document
- **DELETE** `/api/knowledge/files/:fileId` - Delete a file
- **GET** `/api/knowledge/stats` - Get corpus statistics

### Chat / Q&A

- **POST** `/api/chat/ask` - Submit question, get answer from RAG
- **GET** `/api/chat/history` - Chat history (if implemented)

## Next Steps

1. ✅ Place service account key at `./service-account-key.json`
2. ✅ Run `npm run dev` and verify RAG initialization
3. ✅ Test upload endpoint with a sample CSV or PDF
4. ✅ Test chat endpoint to verify retrieval works
5. ✅ Deploy to Cloud Run when ready

## Support

For issues related to:

- **Vertex AI RAG**: [Official Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/rag-overview)
- **Google Auth**: [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)
- **Cloud Run**: [Deployment Guide](https://cloud.google.com/run/docs/deploying)
- **Service Accounts**: [IAM Roles](https://cloud.google.com/iam/docs/understanding-service-accounts)

---

**Last Updated**: January 2025  
**Version**: 1.0 (Production Ready)
