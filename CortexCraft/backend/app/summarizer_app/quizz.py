import io
import json
import re
import os
from typing import Any
from groq import Groq
from dotenv import load_dotenv

from app.summarizer_app.mindmap import extract_text_from_file

load_dotenv()

# ──────────────────────────────────────────────
# MCQ Quiz Generator (Groq Powered)
# ──────────────────────────────────────────────

def generate_mcq_quiz(summary: str, level: str, num_questions: int = 5) -> dict[str, Any]:
    level = (level or "").strip().lower()
    
    level_instructions = {
        "easy":   "Easy: direct factual questions, definitions, and simple comprehension.",
        "medium": "Medium: apply concepts and connect 2-3 ideas from the summary.",
        "hard":   "Hard: scenario-based and inference questions requiring deeper understanding.",
    }.get(level, "General factual questions.")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY missing")

    client = Groq(api_key=api_key)

    prompt = f"""You are creating a {level} MCQ quiz for a student based on the provided summary.
    
{level_instructions}

Return ONLY valid JSON. No markdown. No backticks. No extra text.

JSON schema:
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

"answer" is 0-based index (0=A, 1=B, 2=C, 3=D).
Number of questions: {num_questions}

Summary:
{summary}
"""
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"} # Ensure JSON
        )
        
        raw_json = completion.choices[0].message.content.strip()
        obj = json.loads(raw_json)
        return obj

    except Exception as e:
        print(f"[Quiz LLM Error] {e}")
        return _fallback_mcq_quiz(summary, level, num_questions)


def _fallback_mcq_quiz(summary: str, level: str, num_questions: int = 5) -> dict[str, Any]:
    # Simple static fallback if LLM fails
    questions = []
    for i in range(num_questions):
        questions.append({
            "id": i + 1,
            "question": f"Question about the document {i+1}?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": 0,
            "explanation": "Default explanation."
        })
    return {"level": level, "questions": questions}


def generate_quiz_from_upload(file: io.BytesIO, difficulty: str) -> dict[str, Any]:
    text = extract_text_from_file(file)
    
    # 1. Use Groq for summary
    from app.summarizer_app.summarizer import summarize_text
    summary = summarize_text(text)
    
    # 2. Use Groq for Quiz
    quiz_obj = generate_mcq_quiz(summary=summary, level=difficulty, num_questions=5)

    return {
        "summary":   summary,
        "questions": quiz_obj.get("questions", []),
        "level":     quiz_obj.get("level", difficulty),
    }