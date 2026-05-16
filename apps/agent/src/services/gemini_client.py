import time
from typing import Optional
from src.config import settings
from src.services.logger import logger


class GeminiClient:
    def __init__(self):
        self._client = None
        self._configured = False
        self._init_client()

    def _init_client(self):
        if settings.gemini_provider == "developer" and settings.gemini_api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=settings.gemini_api_key)
                self._configured = True
            except Exception as e:
                logger.error("gemini_init_failed", provider="developer", error=str(e))
                self._configured = False
        elif settings.gemini_provider == "vertex":
            try:
                from google import genai
                self._client = genai.Client(
                    vertexai=True,
                    project=settings.google_cloud_project,
                    location=settings.google_cloud_location,
                )
                self._configured = True
            except Exception as e:
                logger.error("gemini_init_failed", provider="vertex", error=str(e))
                self._configured = False
        else:
            self._configured = False

    def is_configured(self) -> bool:
        return self._configured

    def is_healthy(self) -> bool:
        """Test Gemini connectivity by listing available models."""
        if not self._configured:
            return False
        try:
            models = self._client.models.list()
            next(iter(models), None)
            return True
        except Exception as e:
            logger.error("gemini_health_check_failed", error=str(e))
            return False

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_output_tokens: Optional[int] = None,
    ) -> str:
        if not self._configured:
            raise RuntimeError("Gemini client is not configured. Set GEMINI_API_KEY or Google Cloud credentials.")

        start = time.time()
        selected_model = model or settings.gemini_model
        max_tokens = max_output_tokens or settings.gemini_max_output_tokens

        try:
            if settings.gemini_provider in {"developer", "vertex"}:
                response = self._client.models.generate_content(
                    model=selected_model,
                    contents=prompt,
                    config={
                        "max_output_tokens": max_tokens,
                        "temperature": 0.2,
                        "response_mime_type": "application/json",
                    },
                )
                latency_ms = int((time.time() - start) * 1000)
                result = response.text
                logger.gemini_call(
                    model=selected_model,
                    prompt_version="0.1.0",
                    latency_ms=latency_ms,
                    success=True,
                )
                return result

            else:
                raise RuntimeError(f"Unknown Gemini provider: {settings.gemini_provider}")

        except Exception as e:
            latency_ms = int((time.time() - start) * 1000)
            logger.gemini_call(
                model=selected_model,
                prompt_version="0.1.0",
                latency_ms=latency_ms,
                success=False,
                error=str(e),
            )
            raise RuntimeError(f"Gemini generation failed: {e}")


# Singleton instance
gemini_client = GeminiClient()
