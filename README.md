# 🧠 Enterprise RAG System

A production-ready **Retrieval-Augmented Generation (RAG)** system that allows users to upload PDF documents and ask intelligent questions about them — powered by **Groq LLaMA 3.3 70B**, **Qdrant Cloud**, and a modern **React frontend**.

🌐 **Live Demo:** [https://thriving-luck.up.railway.app](https://thriving-luck.up.railway.app)

---

## ✨ Features

- 📄 **PDF Ingestion** — Upload any PDF and it gets chunked, embedded, and stored in a vector database
- 🔍 **Semantic Search** — Uses `BAAI/bge-base-en-v1.5` bi-encoder for dense vector retrieval
- 🎯 **Cross-Encoder Reranking** — `ms-marco-MiniLM-L-6-v2` reranker for precise top-K chunk selection
- ⚡ **Streaming Responses** — Token-by-token streaming via Server-Sent Events (SSE)
- 💬 **Session Memory** — Maintains last 3 turns of conversation context per session
- 🚫 **Hallucination-Free** — Strict system prompt ensures answers come only from uploaded documents
- 🌐 **React Frontend** — Professional dark-themed UI with real-time streaming chat

---

## 🏗️ Architecture

```
User → React Frontend
            ↓
      FastAPI Backend
            ↓
  ┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
  │   PDF Ingest    │──────▶│  Qdrant Cloud    │◀──────│   Retrieval +    │
  │   + Chunking    │       │  Vector Store    │       │   Reranking      │
  └─────────────────┘       └──────────────────┘       └──────────────────┘
                                                                ↓
                                                     Groq LLaMA 3.3 70B
                                                                ↓
                                                      Streaming Answer
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | Groq — LLaMA 3.3 70B Versatile |
| **Embeddings** | BAAI/bge-base-en-v1.5 (SentenceTransformers) |
| **Reranker** | cross-encoder/ms-marco-MiniLM-L-6-v2 |
| **Vector DB** | Qdrant Cloud |
| **Backend** | FastAPI + Python 3.13 |
| **Frontend** | React 18 + Vite |
| **Hosting** | Railway |

---

## 📁 Project Structure

```
enterprise-rag-system/
├── app/
│   ├── config.py          # Models & API clients setup
│   ├── main.py            # FastAPI app & endpoints
│   ├── schemas.py         # Pydantic models
│   └── rag/
│       ├── ingest.py      # PDF parsing, chunking & embedding
│       ├── retrieve.py    # Vector search + cross-encoder reranking
│       └── generate.py    # LLM generation (streaming & standard)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   └── main.jsx       # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── requirements.txt
├── Procfile
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Groq API Key](https://console.groq.com)
- [Qdrant Cloud](https://cloud.qdrant.io) cluster

### 1. Clone the Repository

```bash
git clone https://github.com/fodaa711/enterprise-rag-system.git
cd enterprise-rag-system
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```
GROQ_API_KEY=your_groq_api_key
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
```

### 4. Run the Backend

```bash
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

### 5. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/ingest` | Upload and index a PDF file |
| `POST` | `/chat` | Ask a question (full response) |
| `POST` | `/chat/stream` | Ask a question (token streaming) |

### Example — Ingest a PDF

```bash
curl -X POST "http://localhost:8000/ingest" \
  -F "file=@document.pdf"
```

### Example — Chat

```bash
curl -X POST "http://localhost:8000/chat" \
  -F "question=What is the main topic of this document?" \
  -F "session_id=user_123"
```

### Example — Streaming Chat

```bash
curl -X POST "http://localhost:8000/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{"question": "Summarize this document", "session_id": "user_123"}'
```

---

## ☁️ Production Deployment (Railway)

The system is deployed as two separate Railway services from the same GitHub repository:

| Service | Root Directory | Purpose |
|---|---|---|
| Backend | *(empty)* | FastAPI API server |
| Frontend | `frontend/` | React web application |

### Required Environment Variables

**Backend service:**

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key |
| `QDRANT_URL` | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | Qdrant Cloud API key |

**Frontend service:**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend Railway URL |

---

## 🔒 How It Works

1. **Ingest** — PDF is parsed, split into overlapping chunks (1000 chars, 200 overlap), embedded using `BAAI/bge-base-en-v1.5`, and stored in Qdrant
2. **Retrieve** — User query is embedded and top-10 chunks are retrieved via cosine similarity search
3. **Rerank** — Top-10 chunks are reranked by `ms-marco-MiniLM-L-6-v2` cross-encoder, keeping top-5
4. **Generate** — Top-5 chunks + chat history + user question are sent to Groq LLaMA 3.3 70B
5. **Stream** — Response is streamed token-by-token back to the frontend

---

## 📄 License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.
