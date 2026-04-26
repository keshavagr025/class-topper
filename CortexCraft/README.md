# 🧠 CortexCraft - AI-Powered Learning Platform
clear
> **Transform Notes → Superpowers: Summary, Mindmaps, Quizzes, Interviews, Resume Analysis**

CortexCraft is an intelligent learning platform that supercharges your study workflow with AI. Upload notes → get instant summaries, visual mindmaps, adaptive quizzes, mock interviews, flashcards, and resume optimization.

## ✨ Features

| Feature | AI-Powered |
|---------|------------|
| 📝 **Smart Summary** | Extracts key points, TL;DR |
| 🗺️ **Visual Mindmaps** | Auto-generates knowledge graphs |
| ✅ **Adaptive Quizzes** | Spaced repetition + knowledge tracing |
| 💬 **Mock Interviews** | Practice technical interviews |
| 📚 **Flashcards** | AI-generated Anki-style cards |
| 📄 **Resume Analyzer** | ATS-optimized suggestions |
| 🤖 **Chat Companion** | Context-aware study assistant |

## 🛠 Tech Stack

**Frontend**
```
React + TypeScript + Vite + TailwindCSS
React Router + TanStack Query
Lucide Icons + Radix UI
```

**Backend**
```
FastAPI + SQLAlchemy + Pydantic
PostgreSQL + Alembic migrations
Gemini/Groq LLM APIs
SentenceTransformer embeddings
ChromaDB vector store
```

**AI/ML**
```
- Gemini/Groq LLMs (summarization, Q&A)
- SentenceTransformer embeddings  
- Knowledge Tracing (BKT/DKT)
- FSRS spaced repetition
- Content-based recommendations
```

## 🏗️ Architecture

```
Frontend (React/TS) → FastAPI (8000)
     ↓ API Calls
FastAPI → PostgreSQL + ChromaDB + Redis(Celery)
     ↓ AI Services
Gemini/Groq → Embeddings → Vector Search
```

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 20+
Python 3.11+
PostgreSQL 15+
Redis 7+
```

### 1. Clone & Install

```bash
git clone <repo>
cd CortexCraft
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

**Backend:**
```bash
cd backend/app
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate (Windows)
pip install -r ../../requirements.txt
alembic upgrade head
uvicorn main:app --reload  # http://localhost:8000/docs
```

### 2. Environment (.env)

```env
DATABASE_URL=postgresql://user:pass@localhost/cortexcraft
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

### 3. Docker (Recommended)

```bash
docker-compose up -d
```

## 📁 Structure

```
CortexCraft/
├── frontend/                    # React + TS
│   ├── src/pages/              # Home, Dashboard, Resume, Interview...
│   ├── src/components/         # UploadArea, AnalysisResults, Chat...
│   ├── src/types/              # TS interfaces
│   └── src/hooks/              # Custom hooks
├── backend/app/                # FastAPI app/
│   ├── ai/llm/                 # Gemini, Groq clients
│   ├── ai/embeddings/          # SentenceTransformer
│   ├── routes/                 # /summary, /quiz, /resume...
│   ├── services/               # Business logic
│   ├── models/                 # SQLAlchemy models
│   └── utils/                  # File parser, OCR
├── docker/                     # Docker configs
└── docs/
```

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/summary` | Generate note summary |
| POST | `/api/quiz` | Create adaptive quiz |
| POST | `/api/resume` | Analyze & optimize resume |
| POST | `/api/interview` | Mock interview questions |
| POST | `/api/chat` | Study companion chat |
| GET | `/health` | Service health |

**Interactive Docs:** http://localhost:8000/docs

## 🧪 Local Development

```bash
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Backend  
cd backend/app && uvicorn main:app --reload

# Terminal 3 - Celery worker (async tasks)
cd backend/app && celery -A tasks worker --loglevel=info

# Terminal 4 - Redis (if not docker)
redis-server
```

## 🧩 Key AI Components

1. **LLM Services** (`ai/llm/`): Gemini/Groq for content generation
2. **Embeddings** (`ai/embeddings/`): Semantic search + RAG
3. **Knowledge Tracing** (`ai/knowledge_tracing/`): BKT/DKT models
4. **Spaced Repetition** (`ai/spaced_repetition/`): FSRS algorithm
5. **Recommendations** (`ai/recommendation/`): Content-based

## 📈 Performance

```
Cold Start: ~2s (model loading)
Summary: ~500ms
Quiz Gen: ~1.2s  
Resume Analysis: ~3s
Vector Search: ~50ms
```

## 🔮 Roadmap

- [x] Core AI features (Summary, Quiz, Resume)
- [x] Adaptive learning system  
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Voice input/OTG

## 🤝 Contributing

1. Fork → Clone → Branch (`feat/your-feature`)
2. Install deps → Test locally
3. PR with changelog

```
npm run lint && npm test
pytest backend/app/tests/
```

## 📄 License

MIT License - See [LICENSE](LICENSE)

## 👥 Authors

Built for learners, by developers 🚀

---
⭐ **Star on GitHub** · 🐛 **Report bugs** · 💬 **Join Discord**

