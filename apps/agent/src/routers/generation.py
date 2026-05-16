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
    approved_plan: Optional[str] = None


class GenerateResponse(BaseModel):
    status: str
    summary: str
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

    if request.mode == "ask":
        result = await agent.ask(request.user_prompt)
    elif request.mode == "plan":
        result = await agent.plan(request.user_prompt)
    elif request.mode == "agent":
        result = await agent.agent(request.user_prompt, request.approved_plan)
    else:
        return GenerateResponse(status="error", summary="Unknown mode", completion_status="done")

    return GenerateResponse(
        status=result.get("status", "ok"),
        summary=result.get("summary", result.get("answer", "")),
        plan=result.get("plan"),
        completion_status=result.get("completion_status", "done"),
    )
