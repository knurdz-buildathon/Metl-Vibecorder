from __future__ import annotations

import argparse
import asyncio
import importlib.util
import platform
import shutil
from urllib.parse import urlparse

import httpx

from .azure import check_azure_openai
from .config import add_common_args, load_settings
from .llm import provider_config_status
from .ollama import check_ollama


def main() -> None:
    parser = argparse.ArgumentParser(description="Check Browser-Use, Playwright, Ollama, and target app readiness.")
    add_common_args(parser)
    args = parser.parse_args()
    settings = load_settings(args)
    asyncio.run(run(settings))


async def run(settings) -> None:  # type: ignore[no-untyped-def]
    checks: list[tuple[str, bool, str, bool]] = []

    checks.append(("Python 3.11+", _python_ok(), platform.python_version(), True))
    checks.append(("browser-use package", _has_module("browser_use"), _module_hint("browser-use"), True))
    checks.append(("playwright package", _has_module("playwright"), _module_hint("playwright"), True))

    provider_ok, provider_detail = provider_config_status(settings)
    checks.append((f"LLM provider {settings.llm_provider}", provider_ok, provider_detail, True))

    if settings.llm_provider == "ollama":
        checks.append(("Ollama CLI installed", shutil.which("ollama") is not None, _ollama_cli_hint(), True))
        ollama = await check_ollama(settings.ollama_base_url, settings.ollama_model)
        checks.append(("Ollama reachable", ollama.ok, ollama.error or settings.ollama_base_url, True))
        checks.append(
            (
                f"Ollama model {settings.ollama_model}",
                ollama.model_available,
                "available" if ollama.model_available else f"run: ollama pull {settings.ollama_model}",
                True,
            )
        )
    elif settings.llm_provider == "azure":
        azure = await check_azure_openai()
        checks.append(("Azure OpenAI reachable", azure.ok, azure.detail, True))
    else:
        checks.append(("Ollama checks", True, f"skipped for provider {settings.llm_provider}", False))

    target_ok, target_detail = await _check_target(settings.target_url)
    checks.append(("Target URL reachable", target_ok, target_detail, True))

    for name, ok, detail, required in checks:
        marker = "PASS" if ok else "FAIL"
        if not required:
            marker = "SKIP"
        print(f"[{marker}] {name}: {detail}")

    if not all(ok or not required for _, ok, _, required in checks):
        raise SystemExit(1)


def _python_ok() -> bool:
    return tuple(map(int, platform.python_version_tuple()[:2])) >= (3, 11)


def _has_module(name: str) -> bool:
    return importlib.util.find_spec(name) is not None


def _module_hint(package_name: str) -> str:
    return "installed" if _has_module(package_name.replace("-", "_")) else f"run: pip install -r requirements.txt"


def _ollama_cli_hint() -> str:
    if shutil.which("ollama"):
        return "installed"

    if shutil.which("brew"):
        return "run: brew install ollama"

    return "install from https://ollama.com"


async def _check_target(url: str) -> tuple[bool, str]:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return False, "invalid URL"

    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            response = await client.get(url)
        return response.status_code < 500, f"HTTP {response.status_code}"
    except Exception as exc:  # noqa: BLE001 - doctor should report the actual connection failure.
        return False, str(exc)


if __name__ == "__main__":
    main()
