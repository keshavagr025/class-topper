# backend/summarizer_app/interview_service.py

import os
import json
import requests
from groq import AsyncGroq
from starlette.concurrency import run_in_threadpool

SYSTEM_PROMPT = """You are an expert technical interviewer conducting a professional mock interview.

Your role:
- Ask one clear, relevant interview question at a time
- Evaluate the candidate's answers critically but fairly
- Give detailed, constructive feedback after each answer
- Track interview progress and adjust difficulty accordingly
- After 5 questions, provide a comprehensive final evaluation

Rules:
- Be professional but conversational
- Ask follow-up questions if the answer is vague
- Provide specific, actionable feedback clearly separated into:
    ✅ Strengths
    ❌ Areas of Improvement
- When giving final evaluation, include:
    Overall Score: X/10
    Strengths, Weaknesses, and Tips for improvement

Start by greeting the candidate warmly and asking:
1. Their name
2. The role/topic they want to practice for
"""


class InterviewService:
    def __init__(self):
        self.model = "llama-3.3-70b-versatile"
        self.ollama_model = "tinyllama"
        self.ollama_url = "http://localhost:11434/api/generate"
        self.client = AsyncGroq(
            api_key=os.getenv("GROQ_API_KEY")
        )

    def _sync_ollama_generate(self, full_prompt: str) -> str:
        try:
            resp = requests.post(
                self.ollama_url,
                json={
                    "model": self.ollama_model,
                    "prompt": full_prompt,
                    "stream": False
                },
                timeout=60.0
            )
            if resp.status_code == 200:
                return resp.json().get("response", "Pratikriya nahi mil saki.")
        except Exception as e:
            print(f"Ollama fetch error: {e}")
        return "I'm having trouble connecting to the local AI brain."

    async def _ollama_fallback(self, messages: list) -> str:
        """Fallback to local Ollama if Groq fails."""
        prompt = "\n".join([f"{msg.role}: {msg.content}" for msg in messages])
        full_prompt = f"{SYSTEM_PROMPT}\n\nConversation so far:\n{prompt}\n\nassistant:"
        return await run_in_threadpool(self._sync_ollama_generate, full_prompt)

    async def get_response(self, messages: list) -> tuple[str, int]:
        groq_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

        try:
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    *groq_messages,
                ],
                temperature=0.7,
                max_tokens=1024,
            )
            reply = completion.choices[0].message.content
        except Exception as e:
            print(f"Groq error: {e}. Falling back to Ollama...")
            reply = await self._ollama_fallback(messages)

        question_count = sum(1 for m in messages if m.role == "assistant")
        return reply, question_count