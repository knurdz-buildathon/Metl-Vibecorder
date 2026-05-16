import time
import traceback
from typing import Optional
from src.config import settings


class StructuredLogger:
    def __init__(self, service: str = "metl-vibecoder-agent"):
        self.service = service

    def _log(self, level: str, event: str, data: dict):
        entry = {
            "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": level,
            "service": self.service,
            "event": event,
            **data,
        }
        print(entry)

    def info(self, event: str, **kwargs):
        self._log("info", event, kwargs)

    def warn(self, event: str, **kwargs):
        self._log("warn", event, kwargs)

    def error(self, event: str, **kwargs):
        self._log("error", event, kwargs)

    def gemini_call(self, model: str, prompt_version: str, latency_ms: int, success: bool, error: Optional[str] = None):
        self._log(
            "info" if success else "error",
            "gemini_call",
            {
                "model": model,
                "prompt_version": prompt_version,
                "latency_ms": latency_ms,
                "success": success,
                "error": error,
                "provider": settings.gemini_provider,
            },
        )


logger = StructuredLogger()
