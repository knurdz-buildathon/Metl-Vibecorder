from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def write_report(report_dir: Path, prefix: str, payload: dict[str, Any]) -> tuple[Path, Path]:
    report_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    json_path = report_dir / f"{stamp}-{prefix}.json"
    md_path = report_dir / f"{stamp}-{prefix}.md"

    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    md_path.write_text(render_markdown(payload), encoding="utf-8")

    return json_path, md_path


def render_markdown(payload: dict[str, Any]) -> str:
    title = payload.get("title") or "Web Test Report"
    lines = [f"# {title}", ""]

    for key in ("status", "target_url", "model", "task", "duration_seconds"):
        if key in payload and payload[key] is not None:
            lines.append(f"- **{key.replace('_', ' ').title()}**: {payload[key]}")

    lines.append("")

    if payload.get("summary"):
        lines.extend(["## Summary", "", str(payload["summary"]), ""])

    if payload.get("issues"):
        lines.extend(["## Issues", ""])
        for issue in payload["issues"]:
            lines.append(f"- {issue}")
        lines.append("")

    if payload.get("suggested_tests"):
        lines.extend(["## Suggested Playwright Tests", ""])
        for test in payload["suggested_tests"]:
            lines.append(f"- {test}")
        lines.append("")

    if payload.get("raw_result"):
        lines.extend(["## Raw Result", "", "```text", str(payload["raw_result"])[:8000], "```", ""])

    return "\n".join(lines)
