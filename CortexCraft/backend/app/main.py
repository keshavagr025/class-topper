from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio as _sio_lib

from routes import resume
from summarizer_app.interview_routes import router as interview_router
from routes.community import router as community_router
from routes.coding import router as coding_router
from routes.summary import router as summary_router
from routes.mindmap import router as mindmap_router
from routes.quiz import router as quiz_router
from routes.flashcards import router as flashcards_router
from routes.chatbot import router as chatbot_router
from routes.analytics import router as analytics_router
from config.db import connect_to_mongo, close_mongo_connection
from socket_coding import sio          # Socket.IO AsyncServer instance


# ── Proper lifespan (works with socketio ASGI wrapper) ──────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="AI Notebook Backend",
    description="Full AI System 🚀",
    version="1.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ──────────────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── REST Routers ──────────────────────────────────────────────────────────────
app.include_router(interview_router,    prefix="/api")
app.include_router(resume.router,       prefix="/api")
app.include_router(community_router,    prefix="/api")
app.include_router(coding_router,       prefix="/api")
app.include_router(summary_router,      prefix="/api")
app.include_router(mindmap_router,      prefix="/api")
app.include_router(quiz_router,         prefix="/api")
app.include_router(flashcards_router,   prefix="/api")
app.include_router(chatbot_router,      prefix="/api")
app.include_router(analytics_router,    prefix="/api")


@app.get("/")
def root():
    return {
        "message": "API running 🚀",
        "endpoints": [
            "/summarize",
            "/mindmap/upload",
            "/mindmap/topic",
            "/quiz/generate",
            "/flashcards/generate",
            "/chat",
            "/chat/upload",
            "/chat/health"
        ]
    }


# ── Wrap FastAPI with Socket.IO ───────────────────────────────────────────────
# IMPORTANT: run server with:  uvicorn main:combined_app --reload
combined_app = _sio_lib.ASGIApp(sio, other_asgi_app=app)
