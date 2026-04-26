import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

def analyze_resume_with_llm(text: str):
    prompt = f"""
    Analyze the following resume and give:
    1. Score out of 100
    2. Strengths
    3. Weaknesses
    4. Suggestions

    Resume:
    {text}

    Output strictly in JSON:
    {{
        "score": int,
        "strengths": [],
        "weaknesses": [],
        "suggestions": []
    }}
    """

    response = model.generate_content(prompt)
    return response.text