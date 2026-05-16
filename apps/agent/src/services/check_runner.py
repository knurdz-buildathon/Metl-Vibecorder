import os
from typing import List, Tuple
from src.config import settings
from src.services.workspace_exec import run_command, detect_package_manager
from src.services.logger import logger


CHECK_SCRIPTS = ["install", "typecheck", "lint", "build", "test"]


def run_check(session_id: str, check_type: str) -> dict:
    """Run a single check and return standardized result."""
    pm = detect_package_manager(session_id)
    command = _build_check_command(pm, check_type)
    if not command:
        return {
            "type": check_type,
            "status": "skipped",
            "command": "",
            "stdout": "",
            "stderr": "No check script found.",
        }

    logger.info("check_started", session_id=session_id, check_type=check_type, command=command)
    rc, stdout, stderr = run_command(session_id, command, timeout=120)
    status = "passed" if rc == 0 else "failed"

    logger.info(
        "check_completed",
        session_id=session_id,
        check_type=check_type,
        status=status,
        return_code=rc,
    )

    return {
        "type": check_type,
        "status": status,
        "command": command,
        "stdout": stdout,
        "stderr": stderr,
    }


def run_all_checks(session_id: str) -> List[dict]:
    results = []
    for check_type in CHECK_SCRIPTS:
        results.append(run_check(session_id, check_type))
    return results


def _build_check_command(pm: str, check_type: str) -> str:
    # Use the appropriate package manager
    prefix = {
        "yarn": "yarn",
        "pnpm": "pnpm",
        "npm": "npm run",
    }.get(pm, "npm run")

    if check_type == "install":
        return {"yarn": "yarn install", "pnpm": "pnpm install", "npm": "npm install"}.get(pm, "npm install")

    # Check if package.json has the script first (would need reading file)
    # For now, map standard names
    script_map = {
        "typecheck": ["typecheck", "tsc", "ts-check"],
        "lint": ["lint"],
        "test": ["test", "test:unit"],
        "build": ["build"],
    }

    scripts = script_map.get(check_type, [])
    for script in scripts:
        return f"{prefix} {script}"

    return ""
