import io
import json
import re
import time
from typing import Any

import requests
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from summarizer_app.mindmap import extract_text_from_file

router = APIRouter(tags=["quiz"])

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "tinyllama"

OLLAMA_TIMEOUT_SUMMARY_SEC = 120
OLLAMA_TIMEOUT_QUIZ_SEC    = 140
OLLAMA_MAX_RETRIES         = 1
MAX_INPUT_CHARS            = 4000


# ──────────────────────────────────────────────
# Core: Streaming Ollama caller
# ──────────────────────────────────────────────
def _ollama_generate(payload: dict, timeout_sec: int) -> str:
    payload = {**payload, "stream": True}
    last_err: Exception | None = None

    for attempt in range(OLLAMA_MAX_RETRIES + 1):
        try:
            resp = requests.post(
                OLLAMA_URL,
                json=payload,
                timeout=timeout_sec,
                stream=True,
            )
            resp.raise_for_status()

            full_text = ""
            for line in resp.iter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError:
                    continue
                full_text += chunk.get("response", "")
                if chunk.get("done"):
                    break

            return full_text

        except requests.exceptions.ReadTimeout as e:
            last_err = e
            print(f"[Ollama] Attempt {attempt + 1}: ReadTimeout — retrying...")
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(
                "Ollama server nahi mila. Kripya 'ollama serve' run karein "
                "aur phir 'ollama run mistral' se model warm karein."
            ) from e
        except requests.exceptions.RequestException as e:
            last_err = e
            print(f"[Ollama] Attempt {attempt + 1}: {e}")

        if attempt < OLLAMA_MAX_RETRIES:
            wait = 2.0 * (attempt + 1)
            print(f"[Ollama] {wait}s baad retry karenge...")
            time.sleep(wait)

    raise RuntimeError(
        f"Ollama {OLLAMA_MAX_RETRIES + 1} attempts ke baad bhi fail raha hai. "
        f"Last error: {last_err}"
    )


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
def _clean_ollama_text(raw: str) -> str:
    raw = re.sub(r"```[a-zA-Z0-9]*", "", raw or "").strip()
    raw = raw.strip("`").strip()
    return raw


def _extract_json_object(raw: str) -> dict[str, Any]:
    raw = _clean_ollama_text(raw)
    start = raw.find("{")
    end   = raw.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(
            "Ollama response mein valid JSON object nahi mila.\n"
            f"Raw response (first 500 chars): {raw[:500]}"
        )
    snippet = raw[start: end + 1]
    try:
        return json.loads(snippet)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON parse error: {e}\nSnippet: {snippet[:300]}") from e


# ──────────────────────────────────────────────
# Summarizer
# ──────────────────────────────────────────────
def summarize_with_ollama(text: str) -> str:
    snippet = (text or "").strip()
    if len(snippet) > MAX_INPUT_CHARS:
        snippet = snippet[:MAX_INPUT_CHARS]

    prompt = f"""Summarize the following document into a concise study summary.

Rules:
- Keep it 200-250 words.
- Use simple language.
- Return ONLY the summary text (no JSON, no markdown, no quotes).

Document:
{snippet}
"""
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "options": {"temperature": 0.2},
    }
    raw = _ollama_generate(payload, timeout_sec=OLLAMA_TIMEOUT_SUMMARY_SEC)
    result = _clean_ollama_text(raw)
    if not result:
        raise ValueError("Ollama ne empty summary di. Model warm hai? 'ollama run mistral' try karein.")
    return result


# ──────────────────────────────────────────────
# MCQ Quiz Generator
# ──────────────────────────────────────────────
def generate_mcq_quiz(summary: str, level: str, num_questions: int = 5) -> dict[str, Any]:
    level = (level or "").strip().lower()
    if level not in {"easy", "medium", "hard"}:
        raise ValueError("difficulty level galat hai. Use: easy / medium / hard")

    level_instructions = {
        "easy":   "Easy: direct factual questions, definitions, and simple comprehension.",
        "medium": "Medium: apply concepts and connect 2-3 ideas from the summary.",
        "hard":   "Hard: scenario-based and inference questions requiring deeper understanding.",
    }[level]

    prompt = f"""You are creating a {level} MCQ quiz for a student.

Use ONLY the given summary. Do not invent facts.

{level_instructions}

Return ONLY valid JSON. No markdown. No backticks. No extra text before or after.

JSON schema (follow exactly):
{{
  "level": "{level}",
  "questions": [
    {{
      "id": 1,
      "question": "string",
      "options": ["A. string", "B. string", "C. string", "D. string"],
      "answer": 0,
      "explanation": "string"
    }}
  ]
}}

"answer" is a 0-based index (0=A, 1=B, 2=C, 3=D).
Number of questions: {num_questions}

Summary:
{summary}
"""
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "options": {"temperature": 0.3},
    }
    raw  = _ollama_generate(payload, timeout_sec=OLLAMA_TIMEOUT_QUIZ_SEC)
    obj  = _extract_json_object(raw)

    if not isinstance(obj, dict) or "questions" not in obj:
        raise ValueError("Ollama JSON schema match nahi hua. 'questions' key missing.")

    questions = obj.get("questions", [])
    if not isinstance(questions, list) or not questions:
        raise ValueError("Ollama ne koi quiz question generate nahi kiya.")

    normalized: list[dict[str, Any]] = []
    for i, q in enumerate(questions[:num_questions]):
        if not isinstance(q, dict):
            continue
        opts = q.get("options", [])
        ans  = q.get("answer", 0)

        if not isinstance(opts, list) or len(opts) != 4:
            print(f"[Quiz] Question {i+1} skip — options invalid: {opts}")
            continue
        try:
            ans_i = int(ans)
            if ans_i not in range(4):
                ans_i = 0
        except Exception:
            ans_i = 0

        normalized.append({
            "id":          q.get("id", i + 1),
            "question":    str(q.get("question", "")),
            "options":     [str(x) for x in opts],
            "answer":      ans_i,
            "explanation": str(q.get("explanation", "")),
        })

    if not normalized:
        raise ValueError("Koi bhi valid quiz question parse nahi hua. Options format check karein.")

    obj["questions"] = normalized
    return obj


def _fallback_mcq_quiz(summary: str, level: str, num_questions: int = 5) -> dict[str, Any]:
    text = re.sub(r"\s+", " ", (summary or "")).strip()
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 25]
    if not sentences:
        sentences = [text] if text else ["Summary unavailable."]

    questions: list[dict[str, Any]] = []
    for i in range(num_questions):
        base = sentences[i % len(sentences)]
        short = base[:120]
        opts = [
            f"A. {short}",
            "B. Not mentioned in summary",
            "C. Opposite statement",
            "D. Random unrelated fact",
        ]
        questions.append(
            {
                "id": i + 1,
                "question": f"According to summary, which statement is most accurate? ({i + 1})",
                "options": opts,
                "answer": 0,
                "explanation": "Option A matches the provided summary content.",
            }
        )

    return {"level": level, "questions": questions}


# ──────────────────────────────────────────────
# Main entry point
# ──────────────────────────────────────────────
def generate_quiz_from_upload(file: io.BytesIO, difficulty: str) -> dict[str, Any]:
    """
    file   : BytesIO object with `.filename` attribute
    Returns: { summary, questions, level }
    """
    text = extract_text_from_file(file)
    if not text or not text.strip():
        raise ValueError("Document se koi text nahi nikla. PDF/file corrupt toh nahi hai?")

    try:
        summary = summarize_with_ollama(text)
    except Exception:
        summary = re.sub(r"\s+", " ", text).strip()[:700]

    try:
        quiz_obj = generate_mcq_quiz(summary=summary, level=difficulty, num_questions=5)
    except Exception:
        quiz_obj = _fallback_mcq_quiz(summary=summary, level=difficulty, num_questions=5)

    return {
        "summary":   summary,
        "questions": quiz_obj["questions"],
        "level":     quiz_obj.get("level", difficulty),
    }


# ──────────────────────────────────────────────
# REST endpoint
# ──────────────────────────────────────────────
@router.post("/quiz/generate")
async def quiz_from_file(
    file: UploadFile = File(...),
    difficulty: str = Form("medium"),
) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="File ka name missing hai.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file empty hai.")

    bio = io.BytesIO(content)
    bio.filename = file.filename.lower()

    try:
        result = await run_in_threadpool(generate_quiz_from_upload, bio, difficulty)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {e}")

    return {"filename": file.filename, **result}