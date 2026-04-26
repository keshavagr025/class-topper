import io
import json
import re
import time
from typing import Optional

import requests
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from summarizer_app.mindmap import extract_text_from_file

router = APIRouter(tags=["chatbot"])

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "tinyllama"
OLLAMA_TIMEOUT_SEC = 45
OLLAMA_MAX_RETRIES = 1
MAX_CONTEXT_CHARS = 3200


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = "No document context. Answer generally."


class OllamaTimeoutError(Exception):
    pass


def _fallback_reply(context: str, question: str) -> str:
    compact = " ".join((context or "").split())
    parts = re.split(r"(?<=[.!?])\s+", compact)
    snippet = " ".join(p.strip() for p in parts[:2] if p.strip())[:260]
    if snippet:
        return (
            f"Quick reply (fast mode): context ke basis par lagta hai ki {snippet} "
            f"\n\nTumhara question: \"{question}\". Agar detailed answer chahiye to same question dobara bhejo."
        )
    return "Quick reply: context limited hai, please thoda specific question bhejo."


def _ollama_generate(prompt: str, system: str = "") -> str:
    payload: dict = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.25, "top_p": 0.9, "num_predict": 280},
    }
    if system:
        payload["system"] = system

    last_timeout: Exception | None = None
    for attempt in range(OLLAMA_MAX_RETRIES + 1):
        try:
            resp = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
                timeout=OLLAMA_TIMEOUT_SEC,
            )
            resp.raise_for_status()
            data = resp.json()
            return (data.get("response") or "").strip()
        except requests.exceptions.ConnectionError as e:
            raise HTTPException(
                status_code=503,
                detail="Ollama connect nahi ho raha. Pehle `ollama serve` run karo.",
            ) from e
        except requests.exceptions.Timeout as e:
            last_timeout = e
            if attempt < OLLAMA_MAX_RETRIES:
                time.sleep(1.5)
                continue
            raise OllamaTimeoutError("Ollama timeout after retries") from e
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=502, detail="Ollama response JSON parse fail.") from e
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=502, detail=f"Ollama error: {e}") from e

    raise OllamaTimeoutError(str(last_timeout) if last_timeout else "Ollama timeout")


def _check_ollama_health() -> dict:
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        resp.raise_for_status()
        models = [m.get("name") for m in resp.json().get("models", []) if m.get("name")]
        return {"status": "ok", "models": models}
    except Exception:
        return {"status": "offline", "models": []}


@router.get("/chat/health")
async def chat_health() -> dict:
    health = await run_in_threadpool(_check_ollama_health)
    return {
        "ollama_status": health["status"],
        "active_model": OLLAMA_MODEL,
        "available_models": health.get("models", []),
        "chat_ready": health["status"] == "ok",
    }


@router.post("/chat")
async def chat_with_context(request: ChatRequest) -> dict:
    if not (request.message or "").strip():
        raise HTTPException(status_code=400, detail="Message empty nahi hona chahiye.")

    system_prompt = """Tu ek helpful AI assistant hai jo document questions answer karta hai.

Rules:
1. Context mein diye gaye documents ke basis pe jawab do
2. Agar context mein answer nahi hai toh clearly bolo
3. Hinglish mein jawab do (Hindi + English mix) — friendly tone
4. Accurate aur helpful raho
5. Technical terms English mein rakh sakte ho
6. Structured jawab do — bullet points, headings use karo jab zaroorat ho"""

    context = (request.context or "").strip()
    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS] + "\n\n...[context truncated for faster reply]..."

    user_prompt = f"""=== DOCUMENT CONTEXT ===
{context}

=== USER QUESTION ===
{request.message}

=== INSTRUCTION ===
Context ke basis pe helpful jawab do. Agar context mein relevant information hai toh use karo.
Agar nahi hai toh general knowledge se jawab do aur clearly batao ki ye document-based nahi hai."""

    try:
        reply = await run_in_threadpool(_ollama_generate, user_prompt, system_prompt)
    except OllamaTimeoutError:
        reply = _fallback_reply(context, request.message)
    return {"reply": reply, "model": OLLAMA_MODEL}


@router.post("/chat/context-upload")
async def upload_context_file(file: UploadFile = File(...)) -> dict:
    """
    Fast context upload endpoint:
    - no LLM summary call
    - only text extraction + compact preview
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file empty hai.")

    bio = io.BytesIO(content)
    bio.filename = file.filename.lower()

    try:
        text = await run_in_threadpool(extract_text_from_file, bio)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File extraction failed: {e}")

    if not text or not text.strip():
        raise HTTPException(status_code=422, detail="File mein readable text nahi mila.")

    compact = " ".join(text.split())
    preview = compact[:2200]
    if len(compact) > 2200:
        preview += " ..."

    return {
        "filename": file.filename,
        "title": file.filename.rsplit(".", 1)[0],
        "summary": preview,
        "chars_extracted": len(text),
    }


@router.post("/chat/upload")
async def chat_with_file(
    file: UploadFile = File(...),
    question: str = Query(..., description="File ke baare mein poochho"),
) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    if not (question or "").strip():
        raise HTTPException(status_code=400, detail="Question required")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file empty hai.")

    bio = io.BytesIO(content)
    bio.filename = file.filename.lower()

    try:
        text = await run_in_threadpool(extract_text_from_file, bio)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File extraction failed: {e}")

    if not text or not text.strip():
        raise HTTPException(status_code=422, detail="File mein readable text nahi mila.")

    context = f"=== {file.filename} ===\n{text[:5000]}"
    system_prompt = "Tu ek helpful document Q&A assistant hai. Hinglish mein jawab do — friendly aur helpful tone."
    user_prompt = f"""{context}

Question: {question}

Document ke content ke basis pe answer do."""

    try:
        reply = await run_in_threadpool(_ollama_generate, user_prompt, system_prompt)
    except OllamaTimeoutError:
        reply = _fallback_reply(text[:MAX_CONTEXT_CHARS], question)
    return {
        "filename": file.filename,
        "question": question,
        "reply": reply,
        "model": OLLAMA_MODEL,
        "chars_extracted": len(text),
    }
