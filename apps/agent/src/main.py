from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers.health import router as health_router
from src.routers.generation import router as generation_router
from src.routers.repair import router as repair_router
from src.routers.review import router as review_router
from src.routers.checks import router as checks_router
from src.config import settings

app = FastAPI(
    title="Metl-VibeCoder Agent",
    version="0.1.0",
    description="AI coding agent service powered by Gemini",
)

# Parse comma-separated CORS origins
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(generation_router, prefix="/generate", tags=["generation"])
app.include_router(repair_router, prefix="/repair", tags=["repair"])
app.include_router(review_router, prefix="/review", tags=["review"])
app.include_router(checks_router, prefix="/checks", tags=["checks"])


@app.get("/")
async def root():
    return {"service": "metl-vibecoder-agent", "version": "0.1.0"}
