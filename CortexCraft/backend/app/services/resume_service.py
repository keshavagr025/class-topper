import json
from ai.llm.groq_llama import analyze_resume_with_llm

def analyze_resume(text: str):
    try:
        response = analyze_resume_with_llm(text)

        # Clean JSON (LLMs sometimes return text + JSON or markdown block)
        start = response.find("{")
        end = response.rfind("}") + 1
        clean_json = response[start:end]

        data = json.loads(clean_json)

        return {
            "score": data.get("score", 0),
            "strengths": data.get("strengths", []),
            "weaknesses": data.get("weaknesses", []),
            "suggestions": data.get("suggestions", []),
            "matched_skills": data.get("matched_skills", []),
            "missing_skills": data.get("missing_skills", [])
        }

    except Exception as e:
        print("Error analyzing with Groq:", e)
        # Raise explicitly so the user sees real errors in API instead of silent fails
        raise Exception(f"Failed to analyze resume: {str(e)}")