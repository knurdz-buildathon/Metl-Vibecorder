from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Literal

router = APIRouter()


class GenerateRequest(BaseModel):
    session_id: str
    mode: Literal["ask", "plan", "agent"]
    user_prompt: str
    repo_path: Optional[str] = None
    project_context: Optional[str] = None
    current_diff: Optional[str] = None
    allowed_tools: List[str] = []


class GenerateResponse(BaseModel):
    status: str
    summary: str
    plan: Optional[str] = None
    files_changed: List[dict] = []
    commands_run: List[str] = []
    tests_to_run: List[str] = []
    risks: List[str] = []
    next_action: Optional[str] = None


@router.post("/", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    # TODO: implement full VibeCoder generation loop
    return GenerateResponse(
        status="ok",
        summary=f"Received {request.mode} mode request for session {request.session_id}",
        next_action="implement",
    )
