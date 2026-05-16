from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Literal

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    gemini_provider: Optional[str] = None
    gemini_configured: bool = False
    gemini_healthy: bool = False
    model: Optional[str] = None


@router.get("/", response_model=HealthResponse)
async def health_check():
    from src.config import settings
    from src.services.gemini_client import gemini_client

    gemini_ok = gemini_client.is_healthy()

    return HealthResponse(
        status="ok",
        service="metl-vibecoder-agent",
        version="0.1.0",
        gemini_provider=settings.gemini_provider,
        gemini_configured=gemini_client.is_configured(),
        gemini_healthy=gemini_ok,
        model=settings.gemini_model if gemini_client.is_configured() else None,
    )
