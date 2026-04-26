# import asyncio
# import functools
# import io
# import os

# from fastapi import APIRouter, File, HTTPException, Query, UploadFile
# from pydantic import BaseModel

# from summarizer_app.mindmap import (
#     extract_keywords,
#     extract_text_from_file as mindmap_extract,
#     generate_tree,
#     json_to_mermaid,
# )
# from summarizer_app.quiz import generate_quiz_from_upload
# from summarizer_app.summarizer import summarize_text
# from summarizer_app.utils import extract_text_from_file

# # 🔥 NEW IMPORT (FLASHCARD)
# from summarizer_app.flashcard import generate_flashcards

# router = APIRouter()

# UPLOAD_DIR = "uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)


# # ==============================
# # REQUEST MODEL
# # ==============================

# class MindmapTopicRequest(BaseModel):
#     topic: str


# # ==============================
# # SUMMARIZER
# # ==============================

# @router.post("/summarize")
# async def summarize_file(file: UploadFile = File(...)):

#     if not file.filename:
#         raise HTTPException(status_code=400, detail="No file uploaded")

#     file_path = os.path.join(UPLOAD_DIR, file.filename)

#     try:
#         content = await file.read()
#         with open(file_path, "wb") as f:
#             f.write(content)

#         text = extract_text_from_file(file_path)

#         if not text.strip():
#             raise HTTPException(status_code=400, detail="Unable to extract text")

#         summary = summarize_text(text)

#         return {
#             "filename": file.filename,
#             "summary": summary
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     finally:
#         if os.path.exists(file_path):
#             os.remove(file_path)


# # ==============================
# # MINDMAP (FILE)
# # ==============================

# @router.post("/mindmap/upload")
# async def mindmap_from_file(file: UploadFile = File(...)):

#     if not file.filename:
#         raise HTTPException(status_code=400, detail="No file uploaded")

#     allowed = (".pdf", ".docx", ".txt")
#     if not file.filename.lower().endswith(allowed):
#         raise HTTPException(status_code=415, detail="Unsupported file")

#     try:
#         content = await file.read()
#         file_obj = io.BytesIO(content)
#         file_obj.filename = file.filename

#         text = mindmap_extract(file_obj)

#         if not text.strip():
#             raise HTTPException(status_code=400, detail="Empty file")

#         keywords = extract_keywords(text)
#         primary = keywords[0] if keywords else file.filename

#         tree = generate_tree(primary)
#         mermaid = json_to_mermaid(tree)

#         return {
#             "filename": file.filename,
#             "keywords": keywords,
#             "primary_topic": primary,
#             "mermaid": mermaid,
#             "tree": tree
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ==============================
# # MINDMAP (TOPIC)
# # ==============================

# @router.post("/mindmap/topic")
# async def mindmap_from_topic(request: MindmapTopicRequest):

#     if not request.topic.strip():
#         raise HTTPException(status_code=400, detail="Topic required")

#     try:
#         tree = generate_tree(request.topic)
#         mermaid = json_to_mermaid(tree)

#         return {
#             "topic": request.topic,
#             "tree": tree,
#             "mermaid": mermaid
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ==============================
# # QUIZ
# # ==============================

# @router.post("/quiz/generate")
# async def quiz_from_file(
#     file: UploadFile = File(...),
#     difficulty: str = Query(default="medium", enum=["easy", "medium", "hard"]),
# ):

#     if not file.filename:
#         raise HTTPException(status_code=400, detail="No file uploaded")

#     try:
#         content = await file.read()
#         file_obj = io.BytesIO(content)
#         file_obj.filename = file.filename

#         loop = asyncio.get_event_loop()
#         result = await loop.run_in_executor(
#             None,
#             functools.partial(generate_quiz_from_upload, file_obj, difficulty),
#         )

#         return {
#             "filename": file.filename,
#             "level": result["level"],
#             "summary": result["summary"],
#             "questions": result["questions"]
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ==============================
# # 🔥 FLASHCARD (NEW)
# # ==============================

# @router.post("/flashcards/generate")
# async def flashcards_from_file(file: UploadFile = File(...)):

#     if not file.filename:
#         raise HTTPException(status_code=400, detail="No file uploaded")

#     try:
#         content = await file.read()
#         file_obj = io.BytesIO(content)
#         file_obj.filename = file.filename

#         text = extract_text_from_file(file_obj)

#         if not text.strip():
#             raise HTTPException(status_code=400, detail="Empty file")

#         loop = asyncio.get_event_loop()
#         flashcards = await loop.run_in_executor(
#             None,
#             functools.partial(generate_flashcards, text),
#         )

#         return {
#             "filename": file.filename,
#             "flashcards": flashcards
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Flashcard error: {e}")

import asyncio
import functools
import io
import os

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from typing import Optional

from summarizer_app.mindmap import (
    extract_keywords,
    extract_text_from_file as mindmap_extract,
    generate_tree,
    json_to_mermaid,
)
from summarizer_app.quiz import generate_quiz_from_upload
from summarizer_app.summarizer import summarize_text
from summarizer_app.utils import extract_text_from_file

# 🔥 FLASHCARD
from summarizer_app.flashcard import generate_flashcards

# 🤖 CHATBOT (chatbot.py se import)
from chatbot import ollama_generate, extract_text, truncate_text, check_ollama_health

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ==============================
# REQUEST MODELS
# ==============================

class MindmapTopicRequest(BaseModel):
    topic: str


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = "No document context. Answer generally."


# ==============================
# SUMMARIZER
# ==============================

@router.post("/summarize")
async def summarize_file(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        text = extract_text_from_file(file_path)

        if not text.strip():
            raise HTTPException(status_code=400, detail="Unable to extract text")

        # ── Ollama se AI summary generate karo ──
        system_prompt = """Tu ek expert document analyzer hai.
Tujhe documents ki clear, structured summary banani hai Hindi aur English mix mein (Hinglish).
Summary mein ye cheezein zaroor shamil kar:
- Main points (bullet points mein)
- Key findings ya conclusions
- Important numbers ya facts
- Overall context
Format: Clean aur readable. Markdown use kar."""

        truncated = truncate_text(text, max_chars=6000)
        user_prompt = f"""Ye document ka text hai:\n\n---\n{truncated}\n---\n\nIs document ki ek comprehensive summary banao.
Pehle ek short title do (1 line), phir detailed summary."""

        loop = asyncio.get_event_loop()
        summary = await loop.run_in_executor(
            None,
            functools.partial(ollama_generate, user_prompt, system_prompt),
        )

        # Title extract karo
        lines = summary.strip().split("\n")
        title = file.filename.rsplit(".", 1)[0]
        for line in lines[:3]:
            clean = line.strip().lstrip("#*").strip()
            if clean and len(clean) < 100 and not clean.endswith(":"):
                title = clean
                break

        return {
            "filename": file.filename,
            "title": title,
            "summary": summary,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


# ==============================
# MINDMAP (FILE)
# ==============================

@router.post("/mindmap/upload")
async def mindmap_from_file(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    allowed = (".pdf", ".docx", ".txt")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=415, detail="Unsupported file")

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        file_obj.filename = file.filename

        text = mindmap_extract(file_obj)

        if not text.strip():
            raise HTTPException(status_code=400, detail="Empty file")

        keywords = extract_keywords(text)
        primary = keywords[0] if keywords else file.filename

        tree = generate_tree(primary)
        mermaid = json_to_mermaid(tree)

        return {
            "filename": file.filename,
            "keywords": keywords,
            "primary_topic": primary,
            "mermaid": mermaid,
            "tree": tree,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# MINDMAP (TOPIC)
# ==============================

@router.post("/mindmap/topic")
async def mindmap_from_topic(request: MindmapTopicRequest):

    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic required")

    try:
        tree = generate_tree(request.topic)
        mermaid = json_to_mermaid(tree)

        return {
            "topic": request.topic,
            "tree": tree,
            "mermaid": mermaid,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# QUIZ
# ==============================

@router.post("/quiz/generate")
async def quiz_from_file(
    file: UploadFile = File(...),
    difficulty: str = Query(default="medium", enum=["easy", "medium", "hard"]),
):

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        file_obj.filename = file.filename

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            functools.partial(generate_quiz_from_upload, file_obj, difficulty),
        )

        return {
            "filename": file.filename,
            "level": result["level"],
            "summary": result["summary"],
            "questions": result["questions"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# FLASHCARD
# ==============================

@router.post("/flashcards/generate")
async def flashcards_from_file(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        content = await file.read()
        file_obj = io.BytesIO(content)
        file_obj.filename = file.filename

        text = extract_text_from_file(file_obj)

        if not text.strip():
            raise HTTPException(status_code=400, detail="Empty file")

        loop = asyncio.get_event_loop()
        flashcards = await loop.run_in_executor(
            None,
            functools.partial(generate_flashcards, text),
        )

        return {
            "filename": file.filename,
            "flashcards": flashcards,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flashcard error: {e}")


# ==============================
# 🤖 CHATBOT — Chat with context
# ==============================

@router.post("/chat")
async def chat_with_context(request: ChatRequest):
    """
    Chatbot endpoint — document context ke saath Q&A.

    Body:
        message : User ka question (required)
        context : Document summaries — frontend se automatically aata hai (optional)

    Returns:
        reply   : AI ka jawab
        model   : Ollama model naam
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message empty nahi hona chahiye.")

    system_prompt = """Tu ek helpful AI assistant hai jo document questions answer karta hai.

Rules:
1. Context mein diye gaye documents ke basis pe jawab do
2. Agar context mein answer nahi hai toh clearly bolo
3. Hinglish mein jawab do (Hindi + English mix) — friendly tone rakh
4. Accurate aur helpful raho
5. Technical terms English mein rakh sakte ho
6. Structured jawab do — bullet points, headings use karo jab zaroorat ho"""

    user_prompt = f"""=== DOCUMENT CONTEXT ===
{request.context}

=== USER QUESTION ===
{request.message}

=== INSTRUCTION ===
Context ke basis pe helpful jawab do. Agar context mein relevant information hai toh use karo.
Agar nahi hai toh general knowledge se jawab do aur clearly batao ki ye document-based nahi hai."""

    try:
        loop = asyncio.get_event_loop()
        reply = await loop.run_in_executor(
            None,
            functools.partial(ollama_generate, user_prompt, system_prompt),
        )
        from chatbot import OLLAMA_MODEL
        return {"reply": reply, "model": OLLAMA_MODEL}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


# ==============================
# 🤖 CHATBOT — Upload + Chat (single request)
# ==============================

@router.post("/chat/upload")
async def chat_with_file(
    file: UploadFile = File(...),
    question: str = Query(..., description="File ke baare mein poochho"),
):
    """
    Ek hi request mein file upload karo aur question poochho.
    Frontend chatbot ke liye — seedha file + question bhejo.

    Query Params:
        question : File ke baare mein kya poochna hai

    Returns:
        reply    : AI ka jawab
        summary  : File ki extracted summary
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question required")

    try:
        content = await file.read()
        content_type = file.content_type or "application/octet-stream"

        # Text extract karo
        loop = asyncio.get_event_loop()
        raw_text, file_type = await loop.run_in_executor(
            None,
            functools.partial(extract_text, content, content_type, file.filename),
        )

        if not raw_text.strip():
            raise HTTPException(status_code=422, detail="File mein readable text nahi mila.")

        truncated = truncate_text(raw_text, max_chars=5000)
        context = f"=== {file.filename} ===\n{truncated}"

        system_prompt = """Tu ek helpful document Q&A assistant hai.
Document context ke basis pe clear aur accurate jawab do.
Hinglish mein jawab do — friendly aur helpful tone."""

        user_prompt = f"""{context}

Question: {question}

Document ke content ke basis pe answer do."""

        reply = await loop.run_in_executor(
            None,
            functools.partial(ollama_generate, user_prompt, system_prompt),
        )

        from chatbot import OLLAMA_MODEL
        return {
            "filename": file.filename,
            "file_type": file_type,
            "question": question,
            "reply": reply,
            "model": OLLAMA_MODEL,
            "chars_extracted": len(raw_text),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat upload error: {str(e)}")


# ==============================
# 🤖 CHATBOT — Health check
# ==============================

@router.get("/chat/health")
async def chat_health():
    """Ollama aur chatbot ka health status check karo."""
    health = check_ollama_health()
    from chatbot import OLLAMA_MODEL
    return {
        "ollama_status": health["status"],
        "active_model": OLLAMA_MODEL,
        "available_models": health.get("models", []),
        "chat_ready": health["status"] == "ok",
    }