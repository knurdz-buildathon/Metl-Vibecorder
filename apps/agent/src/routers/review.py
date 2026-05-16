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
    readiness: str  # not_ready, needs_fix, ready_for_review, ready_for_deploy


@router.post("/", response_model=ReviewResponse)
async def review(request: ReviewRequest):
    # TODO: implement quality review with Gemini
    return ReviewResponse(
        status="ok",
        summary="Review mode stub. Implement quality assessment with Gemini.",
        readiness="ready_for_review",
    )
