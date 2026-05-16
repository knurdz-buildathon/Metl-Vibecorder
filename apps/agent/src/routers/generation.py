from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Literal

router = APIRouter()


class GenerateRequest(BaseModel):
    session_id: str
    mode: Literal["ask", "plan", "agent", "repair", "review"]
    user_prompt: str
    repo_path: Optional[str] = None
    project_context: Optional[str] = None
    current_diff: Optional[str] = None
    allowed_tools: List[str] = []
    approved_plan: Optional[str] = None
    error_logs: Optional[str] = None
    attempt: Optional[int] = None


class GenerateResponse(BaseModel):
    status: str
    summary: str
    message: Optional[str] = None
    plan: Optional[str] = None
    files_changed: List[dict] = []
    commands_run: List[str] = []
    tests_to_run: List[str] = []
    risks: List[str] = []
    next_action: Optional[str] = None
    completion_status: str = "done"


@router.post("/", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    from src.agents.vibecoder_agent import VibeCoderAgent

    agent = VibeCoderAgent(request.session_id)

    result = {}
    if request.mode == "ask":
        result = await agent.ask(request.user_prompt)
    elif request.mode == "plan":
        result = await agent.plan(request.user_prompt)
    elif request.mode == "agent":
        result = await agent.agent(request.user_prompt, request.approved_plan)
    elif request.mode == "repair":
        result = await agent.repair(
            request.error_logs or "",
            attempt=request.attempt or 1,
        )
    elif request.mode == "review":
        result = await agent.review(request.files_changed or [])
    else:
        return GenerateResponse(status="error", summary="Unknown mode", completion_status="done")

    # Prefer message field; fall back to summary/answer for backward compat
    summary = result.get("summary", result.get("answer", result.get("message", "")))
    message = result.get("message", summary)

    return GenerateResponse(
        status=result.get("status", "ok"),
        summary=summary,
        message=message,
        plan=result.get("plan"),
        files_changed=result.get("files_changed", []),
        completion_status=result.get("completion_status", "done"),
    )
