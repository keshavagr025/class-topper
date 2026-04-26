import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env file explicitly
load_dotenv()

# Initialize the Groq client. It will automatically look for GROQ_API_KEY in the environment.
client = Groq()

def analyze_resume_with_llm(text: str) -> str:
    """
    Sends the resume text to Groq (Llama 3 8B or 70B) and demands strict JSON output.
    """
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) and Career Coach.
    Analyze the following resume and strictly output a valid JSON object matching this schema:
    {{
        "score": (an integer between 0 and 100 based on standard ATS parsing),
        "strengths": [(an array of 3 to 5 strings, detailing key technical or professional strengths found)],
        "weaknesses": [(an array of 2 to 4 strings, detailing missing standard skills or formatting flaws)],
        "suggestions": [(an array of 3 actionable tips for improving the resume)],
        "matched_skills": [(an array of 5 to 10 key technical hard skills explicitly listed in the resume)],
        "missing_skills": [(an array of 2 to 5 relevant technical hard skills that are generally expected for this candidate's role but missing)]
    }}

    Do not include any other text, markdown formatting, or explanations outside the JSON object. Just the JSON.

    Resume:
    {text}
    """

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama-3.3-70b-versatile", # updated from decommissioned llama3
        temperature=0.2,
    )
    
    return chat_completion.choices[0].message.content
