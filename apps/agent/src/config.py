from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # FastAPI
    app_name: str = "Metl-VibeCoder Agent"
    debug: bool = False

    # Gemini
    gemini_provider: str = "developer"  # developer | vertex
    gemini_api_key: Optional[str] = None
    google_cloud_project: Optional[str] = None
    google_cloud_location: str = "us-central1"
    google_application_credentials: Optional[str] = None

    gemini_model: str = "gemini-3.1-pro-preview-customtools"
    gemini_review_model: str = "gemini-3.1-pro-preview"
    gemini_fast_model: str = "gemini-3.1-flash-lite"
    gemini_stable_fallback_model: str = "gemini-2.5-pro"
    gemini_max_output_tokens: int = 8192

    # VibeCoder
    vibecoder_max_repair_attempts: int = 2

    # Workspace
    workspace_base_dir: str = "/workspace-volumes"

    # CORS
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
