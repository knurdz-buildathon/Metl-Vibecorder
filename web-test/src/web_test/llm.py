from __future__ import annotations

import os
from typing import Any

from .azure import load_azure_config, normalize_azure_endpoint


def create_llm(settings) -> Any:  # type: ignore[no-untyped-def]
    provider = settings.llm_provider

    if provider == "ollama":
        from browser_use import ChatOllama

        return _create_ollama_llm(ChatOllama, settings.llm_model, settings.ollama_base_url)

    if provider == "azure":
        from browser_use import ChatAzureOpenAI

        config = load_azure_config()
        return ChatAzureOpenAI(
            model=settings.llm_model,
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_endpoint=config.endpoint if config else normalize_azure_endpoint(os.getenv("AZURE_OPENAI_ENDPOINT")),
            azure_deployment=config.deployment if config else os.getenv("AZURE_OPENAI_DEPLOYMENT"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION") or "2025-03-01-preview",
            use_responses_api=os.getenv("AZURE_OPENAI_USE_RESPONSES_API") or "auto",
        )

    raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")


def _create_ollama_llm(chat_ollama_cls: Any, model: str, base_url: str) -> Any:
    for kwargs in (
        {"model": model, "host": base_url},
        {"model": model, "base_url": base_url},
        {"model": model},
    ):
        try:
            return chat_ollama_cls(**kwargs)
        except TypeError:
            continue

    return chat_ollama_cls(model=model)


def provider_config_status(settings) -> tuple[bool, str]:  # type: ignore[no-untyped-def]
    provider = settings.llm_provider

    if provider == "ollama":
        return True, f"Ollama local model: {settings.llm_model}"

    if provider == "azure":
        missing = [
            name
            for name in ("AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_DEPLOYMENT")
            if not os.getenv(name)
        ]
        if missing:
            return False, f"set {', '.join(missing)} in .env"
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT") or settings.llm_model
        api_version = os.getenv("AZURE_OPENAI_API_VERSION") or "2025-03-01-preview"
        return True, f"deployment={deployment}, api_version={api_version}"

    return False, f"unsupported provider: {provider}"
