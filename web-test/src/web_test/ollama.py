from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True)
class OllamaStatus:
    ok: bool
    base_url: str
    model: str
    models: list[str]
    error: str | None = None

    @property
    def model_available(self) -> bool:
        return self.model in self.models


async def check_ollama(base_url: str, model: str, timeout: float = 5.0) -> OllamaStatus:
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(f"{base_url.rstrip('/')}/api/tags")
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:  # noqa: BLE001 - this command should report all connection failures.
        return OllamaStatus(ok=False, base_url=base_url, model=model, models=[], error=str(exc))

    models = _extract_model_names(payload)
    return OllamaStatus(ok=True, base_url=base_url, model=model, models=models)


def _extract_model_names(payload: dict[str, Any]) -> list[str]:
    names: list[str] = []

    for item in payload.get("models", []):
        if isinstance(item, dict) and isinstance(item.get("name"), str):
            names.append(item["name"])

    return sorted(names)
