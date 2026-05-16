from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from src.config import settings

router = APIRouter()


class RepairRequest(BaseModel):
    session_id: str
    repo_path: str
    error_logs: str
    test_logs: Optional[str] = None
    file_edits_so_far: List[dict] = []
    attempt: int = 1


class RepairResponse(BaseModel):
    status: str
    fixed: bool
    summary: str
    files_changed: List[dict] = []
    next_action: Optional[str] = None
    attempt: int = 1
    completion_status: str = "done"


@router.post("/", response_model=RepairResponse)
async def repair(request: RepairRequest):
    from src.agents.vibecoder_agent import VibeCoderAgent

    agent = VibeCoderAgent(request.session_id)
    result = await agent.repair(request.error_logs, request.attempt)

    max_attempts = settings.vibecoder_max_repair_attempts
    needs_more = (
        result.get("completion_status") == "needs_repair"
        and request.attempt < max_attempts
    )

    return RepairResponse(
        status=result.get("status", "ok"),
        fixed=result.get("fixed", False),
        summary=result.get("summary", ""),
        attempt=request.attempt,
        next_action="retry" if needs_more else "manual_fix" if not result.get("fixed") else "done",
        completion_status=result.get("completion_status", "done"),
    )
