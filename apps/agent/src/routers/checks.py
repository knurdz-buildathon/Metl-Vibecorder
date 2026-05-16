from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class CheckRequest(BaseModel):
    session_id: str
    check_type: Optional[str] = None  # if None, run all


class CheckResponse(BaseModel):
    status: str
    results: list = []


@router.post("/", response_model=CheckResponse)
async def run_checks(request: CheckRequest):
    from src.services.check_runner import run_check, run_all_checks

    if request.check_type:
        results = [run_check(request.session_id, request.check_type)]
    else:
        results = run_all_checks(request.session_id)

    return CheckResponse(
        status="ok",
        results=results,
    )
