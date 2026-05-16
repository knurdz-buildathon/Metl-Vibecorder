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
    max_attempts: int = settings.vibecoder_max_repair_attempts


class RepairResponse(BaseModel):
    status: str
    fixed: bool
    summary: str
    files_changed: List[dict] = []
    next_action: Optional[str] = None


@router.post("/", response_model=RepairResponse)
async def repair(request: RepairRequest):
    max_attempts = settings.vibecoder_max_repair_attempts
    # TODO: implement repair loop with Gemini
    return RepairResponse(
        status="ok",
        fixed=False,
        summary="Repair mode stub. Implement fix loop with Gemini analysis.",
        next_action="manual_fix" if request.attempt >= max_attempts else "retry",
    )
