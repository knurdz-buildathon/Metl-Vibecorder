from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SCENARIO = ROOT / "scenarios" / "metl_local_smoke.json"


@dataclass(frozen=True)
class Settings:
    target_url: str
    llm_provider: str
    llm_model: str
    ollama_base_url: str
    headless: bool
    browser_width: int
    browser_height: int
    max_steps: int
    report_dir: Path

    @property
    def ollama_model(self) -> str:
        return self.llm_model


def load_settings(args: argparse.Namespace | None = None) -> Settings:
    load_dotenv(ROOT / ".env")
    provider = _read_value(args, "provider", "LLM_PROVIDER", "ollama").strip().lower()

    return Settings(
        target_url=_read_value(args, "url", "TARGET_URL", "http://localhost:3000"),
        llm_provider=provider,
        llm_model=_read_model(args, provider),
        ollama_base_url=_read_value(args, "ollama_base_url", "OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/"),
        headless=_read_bool(args, "headless", "BROWSER_HEADLESS", False),
        browser_width=_read_int(args, "browser_width", "BROWSER_WIDTH", 1280),
        browser_height=_read_int(args, "browser_height", "BROWSER_HEIGHT", 900),
        max_steps=_read_int(args, "max_steps", "MAX_STEPS", 40),
        report_dir=ROOT / _read_value(args, "report_dir", "REPORT_DIR", "reports"),
    )


def add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--url", help="Target app URL to test.")
    parser.add_argument(
        "--provider",
        choices=["ollama", "azure"],
        help="LLM provider for the Browser-Use agent.",
    )
    parser.add_argument("--model", help="LLM model name. For Ollama, for example qwen2.5:7b-instruct.")
    parser.add_argument("--ollama-base-url", help="Ollama base URL.")
    parser.add_argument("--report-dir", help="Report directory relative to web-test/.")
    parser.add_argument("--max-steps", type=int, help="Maximum Browser-Use agent steps.")
    parser.add_argument("--browser-width", type=int, help="Browser viewport width.")
    parser.add_argument("--browser-height", type=int, help="Browser viewport height.")

    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--headed", action="store_true", help="Show the browser window.")
    mode.add_argument("--headless", action="store_true", help="Run browser headlessly.")


def _read_value(args: argparse.Namespace | None, attr: str, env_name: str, default: str) -> str:
    value = getattr(args, attr, None) if args else None
    return str(value or os.getenv(env_name) or default)


def _read_model(args: argparse.Namespace | None, provider: str) -> str:
    value = getattr(args, "model", None) if args else None
    if value:
        return str(value)

    explicit_provider = getattr(args, "provider", None) if args else None
    env_provider = (os.getenv("LLM_PROVIDER") or "").strip().lower()
    env_value = os.getenv("LLM_MODEL")
    if env_value and (not explicit_provider or provider == env_provider):
        return env_value

    if provider == "ollama":
        return os.getenv("OLLAMA_MODEL") or "qwen2.5:7b-instruct"

    return {
        "azure": "gpt-5.2",
    }.get(provider, "qwen2.5:7b-instruct")


def _read_int(args: argparse.Namespace | None, attr: str, env_name: str, default: int) -> int:
    value = getattr(args, attr, None) if args else None
    raw = value if value is not None else os.getenv(env_name)

    if raw is None:
        return default

    try:
        return int(raw)
    except ValueError:
        return default


def _read_bool(args: argparse.Namespace | None, attr: str, env_name: str, default: bool) -> bool:
    if args and getattr(args, "headed", False):
        return False

    if args and getattr(args, "headless", False):
        return True

    value = getattr(args, attr, None) if args else None
    if isinstance(value, bool):
        return value

    raw = os.getenv(env_name)
    if raw is None:
        return default

    return raw.strip().lower() in {"1", "true", "yes", "on"}
