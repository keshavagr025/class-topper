from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import numpy as np
from sklearn.linear_model import LinearRegression
import os
from groq import Groq

router = APIRouter()

# ---------------------------
# Input Schema
# ---------------------------
class StudyPlanRequest(BaseModel):
    subjects: list[str]
    hours_per_day: float
    exam_date: str
    difficulty: dict  # {"Math": "hard", "Science": "medium"}

# ---------------------------
# ML-Powered Scheduler (Logic)
# ---------------------------
class StudyOptimizer:
    def __init__(self):
        self.model = LinearRegression()
        X = np.array([
            [3, 4, 30], [2, 4, 30], [1, 4, 30],
            [3, 8, 7],  [2, 8, 7],  [1, 8, 7],
            [3, 2, 60], [2, 2, 60], [1, 2, 60],
            [3, 4, 5],  [2, 4, 5],  [1, 4, 5],
        ])
        y = np.array([
            0.50, 0.30, 0.20,
            0.60, 0.25, 0.15,
            0.40, 0.35, 0.25,
            0.70, 0.20, 0.10,
        ])
        self.model.fit(X, y)

    def predict_allocation_ratio(self, diff_val, budget, days_left):
        days_clamped = max(1, min(days_left, 100))
        input_features = np.array([[diff_val, budget, days_clamped]])
        pred = self.model.predict(input_features)[0]
        return max(0.1, min(pred, 0.8))

optimizer = StudyOptimizer()

# ---------------------------
# AI Advice Generator (LLM)
# ---------------------------
def generate_ai_advice(subjects, difficulty, days_left):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Please configure your GROQ_API_KEY for personalized AI advice."
    
    client = Groq(api_key=api_key)
    
    prompt = f"""
    As an AI Education Expert, provide a high-level study strategy for a student with {days_left} days left until their exams.
    
    Subjects & Student-Reported Difficulty:
    {", ".join([f"{s} ({d})" for s, d in difficulty.items()])}
    
    Provide:
    1. A 'Pro Strategy' (2 sentences) on how to balance these subjects.
    2. One 'Actionable Tip' for the hardest subject.
    3. A brief 'Confidence Booster' sentence.
    
    Tone: Encouraging, academic, and elite. Keep it very concise (under 100 words total).
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=250,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"AI Advice is currently unavailable: {str(e)}"

# ---------------------------
# API Endpoint
# ---------------------------
@router.post("/generate-study-plan")
def generate_study_plan(data: StudyPlanRequest):
    try:
        exam_dt = datetime.strptime(data.exam_date, "%Y-%m-%d")
        now_dt = datetime.now()
        days_left = (exam_dt - now_dt).days
        if days_left < 1: days_left = 1
    except:
        days_left = 30

    difficulty_map = {"easy": 1, "medium": 2, "hard": 3}
    
    subject_allocations = []
    total_raw_ratio = 0
    
    for sub in data.subjects:
        diff_val = difficulty_map.get(data.difficulty.get(sub, "medium"), 2)
        ratio = optimizer.predict_allocation_ratio(diff_val, data.hours_per_day, days_left)
        
        subject_allocations.append({
            "name": sub,
            "ratio": ratio,
            "difficulty": diff_val
        })
        total_raw_ratio += ratio

    daily_plan = {}
    for item in subject_allocations:
        normalized_ratio = item["ratio"] / total_raw_ratio
        sub_hours = normalized_ratio * data.hours_per_day
        daily_plan[item["name"]] = round(sub_hours, 1)

    weekly_schedule = []
    for day_num in range(1, 8):
        day_label = f"Day {day_num}"
        day_schedule = {"day": day_label}
        for sub, base_hrs in daily_plan.items():
            jitter = np.random.uniform(0.9, 1.1)
            variation = base_hrs * jitter
            day_schedule[sub] = round(variation, 1)
        weekly_schedule.append(day_schedule)

    # 4. Integrate AI Advice
    ai_advice = generate_ai_advice(data.subjects, data.difficulty, days_left)

    return {
        "days_left": days_left,
        "daily_plan": daily_plan,
        "weekly_schedule": weekly_schedule,
        "ai_advice": ai_advice
    }