from __future__ import annotations

import os
from dataclasses import dataclass

import httpx


@dataclass(frozen=True)
class AzureConfig:
    endpoint: str
    api_key: str
    deployment: str
    api_version: str
    endpoint_was_normalized: bool


@dataclass(frozen=True)
class AzureStatus:
    ok: bool
    detail: str


def load_azure_config() -> AzureConfig | None:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT") or ""
    api_key = os.getenv("AZURE_OPENAI_API_KEY") or ""
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT") or ""

    if not endpoint or not api_key or not deployment:
        return None

    normalized_endpoint = normalize_azure_endpoint(endpoint)
    return AzureConfig(
        endpoint=normalized_endpoint,
        api_key=api_key,
        deployment=deployment,
        api_version=os.getenv("AZURE_OPENAI_API_VERSION") or "2025-03-01-preview",
        endpoint_was_normalized=normalized_endpoint != endpoint.rstrip("/"),
    )


def normalize_azure_endpoint(endpoint: str | None) -> str | None:
    if not endpoint:
        return endpoint

    normalized = endpoint.rstrip("/")
    for suffix in ("/openai/v1", "/openai"):
        if normalized.endswith(suffix):
            return normalized[: -len(suffix)]

    return normalized


async def check_azure_openai(timeout: float = 20.0) -> AzureStatus:
    config = load_azure_config()
    if config is None:
        missing = [
            name
            for name in ("AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_DEPLOYMENT")
            if not os.getenv(name)
        ]
        return AzureStatus(False, f"set {', '.join(missing)} in .env")

    url = (
        f"{config.endpoint}/openai/deployments/"
        f"{config.deployment}/chat/completions?api-version={config.api_version}"
    )
    payload = {
        "messages": [{"role": "user", "content": "Reply with OK."}],
        "max_completion_tokens": 8,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, headers={"api-key": config.api_key}, json=payload)
    except Exception as exc:  # noqa: BLE001 - preflight should explain connection failures directly.
        return AzureStatus(False, str(exc))

    if response.status_code == 200:
        detail = f"deployment={config.deployment}, api_version={config.api_version}"
        if config.endpoint_was_normalized:
            detail += ", normalized endpoint to resource root"
        return AzureStatus(True, detail)

    message = _azure_error_message(response).rstrip(".")
    if response.status_code == 404:
        message = (
            f"{message}. Check AZURE_OPENAI_DEPLOYMENT. It must be the deployment name "
            "inside your Azure OpenAI resource, not just the model name."
        )
    elif response.status_code in {401, 403}:
        message = f"{message}. Check AZURE_OPENAI_API_KEY and that it belongs to this endpoint."

    return AzureStatus(False, f"HTTP {response.status_code}: {message}")


def _azure_error_message(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return response.text[:500]

    error = body.get("error")
    if isinstance(error, dict) and error.get("message"):
        return str(error["message"])

    return str(body)[:500]
