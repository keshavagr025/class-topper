from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from config.db import get_database
from bson import ObjectId
import json
import requests

router = APIRouter(tags=["analytics"])

# Config for AI Roadmap
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "tinyllama"

class QuizResult(BaseModel):
    user_id: str
    topic: str
    score: int
    total_questions: int
    level: str
    incorrect_topics: List[str]  # Sub-topics where user failed

class RoadmapRequest(BaseModel):
    user_id: str
    subject: str
    current_knowledge: Optional[str] = "beginner"

@router.post("/analytics/quiz-result")
async def save_quiz_result(data: QuizResult):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    result_doc = data.dict()
    result_doc["timestamp"] = datetime.utcnow()
    
    await db["quiz_results"].insert_one(result_doc)
    
    # Logic for Adaptive Recommendation
    # Check last 3 results to suggest next difficulty
    cursor = db["quiz_results"].find({"user_id": data.user_id}).sort("timestamp", -1).limit(3)
    results = []
    async for r in cursor:
        results.append(r)
    
    recommendation = "medium"
    if len(results) >= 3:
        avg_score = sum(r["score"] for r in results) / sum(r["total_questions"] for r in results)
        if avg_score > 0.8:
            recommendation = "hard"
        elif avg_score < 0.4:
            recommendation = "easy"
            
    return {"status": "success", "recommended_next_level": recommendation}

@router.get("/analytics/dashboard/{user_id}")
async def get_dashboard_stats(user_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    cursor = db["quiz_results"].find({"user_id": user_id}).sort("timestamp", 1)
    results = []
    async for r in cursor:
        r["_id"] = str(r["_id"])
        results.append(r)
    
    if not results:
        return {"has_data": False}
    
    # Calculate Weakness/Strength
    weak_topics = {}
    total_score = 0
    total_q = 0
    
    for r in results:
        total_score += r["score"]
        total_q += r["total_questions"]
        for topic in r.get("incorrect_topics", []):
            weak_topics[topic] = weak_topics.get(topic, 0) + 1
            
    # Sort weak topics
    sorted_weak = sorted(weak_topics.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "has_data": True,
        "total_quizzes": len(results),
        "avg_score": (total_score / total_q) * 100 if total_q > 0 else 0,
        "history": results,
        "weak_areas": [item[0] for item in sorted_weak[:5]],
        "smart_level": "Professional" if (total_score/total_q) > 0.8 else "Intermediate" if (total_score/total_q) > 0.5 else "Novice"
    }

@router.post("/analytics/study-plan")
async def generate_study_plan(req: RoadmapRequest):
    # This uses AI to generate a 7-day personalized study plan
    prompt = f"""Generate a high-intensity 7-day personalized study roadmap for a {req.current_knowledge} level student studying {req.subject}.
    
    Rules:
    - Day 1-2: Foundations.
    - Day 3-5: Core concepts & practical.
    - Day 6: Advanced topics.
    - Day 7: Revision & final project.
    
    Return ONLY valid JSON in this format:
    {{
       "subject": "{req.subject}",
       "roadmap": [
         {{"day": 1, "topic": "string", "tasks": ["task1", "task2"]}},
         ... up to day 7
       ]
    }}
    """
    
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={"model": MODEL, "prompt": prompt, "stream": False},
            timeout=60
        )
        resp.raise_for_status()
        raw_text = resp.json().get("response", "")
        
        # Extract JSON
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        plan_json = json.loads(raw_text[start:end+1])
        return plan_json
    except Exception as e:
        # Fallback plan
        return {
            "subject": req.subject,
            "roadmap": [
                {"day": 1, "topic": f"Introduction to {req.subject}", "tasks": ["Read basic docs", "Watch intro video"]},
                {"day": 2, "topic": "Core Setup", "tasks": ["Environment configuration", "First simple project"]},
                {"day": 7, "topic": "Consolidation", "tasks": ["Final quiz", "Project review"]}
            ],
            "note": "AI service busy, providing basic template."
        }
