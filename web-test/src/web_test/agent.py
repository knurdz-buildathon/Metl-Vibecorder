from __future__ import annotations

import argparse
import asyncio
import time
from typing import Any

from .azure import check_azure_openai
from .config import add_common_args, load_settings
from .llm import create_llm
from .ollama import check_ollama
from .reports import write_report


DEFAULT_TASK = "Explore the target web app like a QA tester. Find broken buttons, confusing flows, failed forms, and navigation problems."


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a Browser-Use + Ollama exploratory browser agent.")
    add_common_args(parser)
    parser.add_argument("--task", default=DEFAULT_TASK, help="Natural language testing task for the browser agent.")
    args = parser.parse_args()
    settings = load_settings(args)
    asyncio.run(run(settings, args.task))


async def run(settings, task: str) -> None:  # type: ignore[no-untyped-def]
    if settings.llm_provider == "ollama":
        ollama = await check_ollama(settings.ollama_base_url, settings.ollama_model)
        if not ollama.ok:
            raise SystemExit(f"Ollama is not reachable at {settings.ollama_base_url}: {ollama.error}")
        if not ollama.model_available:
            raise SystemExit(f"Model not found: {settings.ollama_model}. Run: ollama pull {settings.ollama_model}")
    elif settings.llm_provider == "azure":
        azure = await check_azure_openai()
        if not azure.ok:
            raise SystemExit(f"Azure OpenAI is not ready: {azure.detail}")

    from browser_use import Agent

    started = time.time()
    llm = create_llm(settings)
    agent_kwargs: dict[str, Any] = {
        "task": build_task(settings.target_url, task),
        "llm": llm,
    }

    browser = await _create_browser(settings)
    if browser is not None:
        agent_kwargs["browser"] = browser

    history = None
    raw_result = ""
    try:
        agent = Agent(**agent_kwargs)
        history = await agent.run(max_steps=settings.max_steps)
        raw_result = extract_result_text(history)
    finally:
        close = getattr(browser, "close", None)
        if callable(close):
            maybe_awaitable = close()
            if hasattr(maybe_awaitable, "__await__"):
                await maybe_awaitable

    payload = {
        "title": "Metl Browser Agent Report",
        "status": "complete",
        "target_url": settings.target_url,
        "provider": settings.llm_provider,
        "model": settings.llm_model,
        "task": task,
        "duration_seconds": round(time.time() - started, 2),
        "summary": summarize_result(raw_result),
        "raw_result": raw_result,
        "suggested_tests": [
            "Promote repeated agent findings into web_test.smoke scenario selectors.",
            "Add stable data-testid attributes in the app for high-value flows.",
        ],
    }
    json_path, md_path = write_report(settings.report_dir, "agent", payload)
    print(f"Agent run complete.")
    print(f"JSON report: {json_path}")
    print(f"Markdown report: {md_path}")


async def _create_browser(settings) -> Any:  # type: ignore[no-untyped-def]
    try:
        from browser_use import Browser
    except ImportError:
        return None

    try:
        return Browser(
            headless=settings.headless,
            window_size={"width": settings.browser_width, "height": settings.browser_height},
        )
    except TypeError:
        try:
            return Browser(headless=settings.headless)
        except TypeError:
            return Browser()


def build_task(target_url: str, task: str) -> str:
    return f"""
You are testing this web app: {target_url}

Open the target URL first. Stay on this app unless an expected local auth or local callback flow opens.

Task:
{task}

Safety:
- Do not make purchases.
- Do not delete data.
- Do not submit destructive actions.
- Do not invent real credentials.
- If login is blocked by missing credentials, report it clearly.
- Prefer observation and non-destructive form filling.

Report:
- What worked.
- What broke.
- Exact buttons/forms/pages involved.
- Suggested deterministic Playwright tests to add next.
""".strip()


def extract_result_text(history: Any) -> str:
    if history is None:
        return ""

    for attr in ("final_result", "result", "output"):
        value = getattr(history, attr, None)
        if callable(value):
            try:
                value = value()
            except TypeError:
                continue
        if value:
            return str(value)

    return str(history)


def summarize_result(raw_result: str) -> str:
    if not raw_result:
        return "Agent completed without a structured final result."

    return raw_result[:1000]


if __name__ == "__main__":
    main()
