# backend/summarizer_app/interview_routes.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from .interview_service import InterviewService

router = APIRouter(prefix="/interview", tags=["interview"])
service = InterviewService()


class MessageDTO(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class InterviewRequest(BaseModel):
    messages: list[MessageDTO]
    interview_type: Optional[str] = "general"


class InterviewResponse(BaseModel):
    reply: str
    question_count: int


@router.post("", response_model=InterviewResponse)
async def conduct_interview(request: InterviewRequest):
    try:
        reply, question_count = await service.get_response(
            messages=request.messages,
        )
        return InterviewResponse(reply=reply, question_count=question_count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    return {"status": "ok", "model": service.model}