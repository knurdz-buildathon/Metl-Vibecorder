from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers.health import router as health_router
from src.routers.generation import router as generation_router
from src.routers.repair import router as repair_router
from src.routers.review import router as review_router

app = FastAPI(
    title="Metl-VibeCoder Agent",
    version="0.1.0",
    description="AI coding agent service powered by Gemini",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(generation_router, prefix="/generate", tags=["generation"])
app.include_router(repair_router, prefix="/repair", tags=["repair"])
app.include_router(review_router, prefix="/review", tags=["review"])


@app.get("/")
async def root():
    return {"service": "metl-vibecoder-agent", "version": "0.1.0"}
