import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def summarize_text(text: str) -> str:
    """
    Summarizes text using Groq LLM (llama-3.3-70b-versatile).
    Much faster and more accurate than local transformer models.
    """
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return "Error: GROQ_API_KEY missing in .env"

        client = Groq(api_key=api_key)

        prompt = (
            "You are a professional educational summarizer. "
            "Summarize the following document into a concise study summary. "
            "Maintain high accuracy and keep it structured with key points if necessary. "
            "Language: Professional English.\n\n"
            f"Document:\n{text[:6000]}" # Limit input for safety
        )

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1024,
        )

        return completion.choices[0].message.content.strip()

    except Exception as e:
        print(f"[Summarizer Error] {e}")
        # Return a simple truncated fallback if LLM fails
        return text[:800] + "..."