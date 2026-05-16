from __future__ import annotations

import argparse
import asyncio
import json
import time
from pathlib import Path
from typing import Any

from .config import DEFAULT_SCENARIO, add_common_args, load_settings
from .reports import write_report


def main() -> None:
    parser = argparse.ArgumentParser(description="Run deterministic Playwright smoke checks.")
    add_common_args(parser)
    parser.add_argument("--scenario", default=str(DEFAULT_SCENARIO), help="Scenario JSON path.")
    args = parser.parse_args()
    settings = load_settings(args)
    asyncio.run(run(settings, Path(args.scenario)))


async def run(settings, scenario_path: Path) -> None:  # type: ignore[no-untyped-def]
    from playwright.async_api import async_playwright

    scenario = _load_scenario(scenario_path)
    started = time.time()
    issues: list[str] = []
    console_errors: list[str] = []
    page_errors: list[str] = []
    link_samples: list[str] = []

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=settings.headless)
        page = await browser.new_page(viewport={"width": settings.browser_width, "height": settings.browser_height})
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))

        response = await page.goto(settings.target_url, wait_until="domcontentloaded", timeout=30_000)
        try:
            await page.wait_for_load_state("networkidle", timeout=10_000)
        except Exception:
            pass

        if response is None:
            issues.append("No response returned when loading the target URL.")
        elif response.status >= 500:
            issues.append(f"Target URL returned HTTP {response.status}.")

        title = await page.title()
        if not title:
            issues.append("Page title is empty.")

        for check in scenario.get("checks", []):
            if check.get("type") == "selector_visible":
                selector = check.get("selector", "")
                label = check.get("label", selector)
                try:
                    await page.locator(selector).first.wait_for(state="visible", timeout=5000)
                except Exception as exc:  # noqa: BLE001 - include failing selector context in report.
                    issues.append(f"Selector not visible: {label} ({selector}) - {exc}")

        limit = int(scenario.get("link_sample_limit", 0) or 0)
        if limit > 0:
            link_samples = await page.locator("a[href]").evaluate_all(
                "(links, limit) => links.slice(0, limit).map((a) => `${a.textContent.trim()} -> ${a.href}`)",
                limit,
            )

        screenshot_path = None
        if issues or console_errors or page_errors:
            settings.report_dir.mkdir(parents=True, exist_ok=True)
            screenshot_path = settings.report_dir / "latest-smoke-failure.png"
            await page.screenshot(path=str(screenshot_path), full_page=True)

        await browser.close()

    payload: dict[str, Any] = {
        "title": "Metl Web Smoke Report",
        "status": "pass" if not (issues or page_errors) else "fail",
        "target_url": settings.target_url,
        "duration_seconds": round(time.time() - started, 2),
        "summary": f"Loaded {settings.target_url} and ran {len(scenario.get('checks', []))} selector checks.",
        "issues": issues + [f"Page error: {item}" for item in page_errors],
        "console_errors": console_errors,
        "link_samples": link_samples,
        "screenshot": str(screenshot_path) if screenshot_path else None,
        "suggested_tests": [
            "Add explicit selectors for the login/register flow once stable data-testids exist.",
            "Convert any agent-found critical flow into a deterministic Playwright test.",
        ],
    }
    json_path, md_path = write_report(settings.report_dir, "smoke", payload)
    print(f"Smoke status: {payload['status']}")
    print(f"JSON report: {json_path}")
    print(f"Markdown report: {md_path}")

    if payload["status"] != "pass":
        raise SystemExit(1)


def _load_scenario(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"checks": [{"type": "selector_visible", "selector": "body", "label": "page body"}]}

    return json.loads(path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
