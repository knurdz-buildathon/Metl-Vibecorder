from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class ReviewRequest(BaseModel):
    session_id: str
    repo_path: str
    files_changed: List[str]
    test_results: Optional[str] = None
    build_output: Optional[str] = None


class ReviewResponse(BaseModel):
    status: str
    summary: str
    risks: List[str] = []
    notes: List[str] = []
    readiness: str = "ready_for_review"
    completion_status: str = "done"


@router.post("/", response_model=ReviewResponse)
async def review(request: ReviewRequest):
    from src.agents.vibecoder_agent import VibeCoderAgent

    agent = VibeCoderAgent(request.session_id)
    result = await agent.review(request.files_changed)

    return ReviewResponse(
        status=result.get("status", "ok"),
        summary=result.get("summary", ""),
        risks=result.get("risks", []),
        readiness=result.get("readiness", "ready_for_review"),
        completion_status=result.get("completion_status", "done"),
    )
