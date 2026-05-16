import json
from typing import List
from src.services.workspace_exec import run_command, detect_package_manager
from src.services.logger import logger


CHECK_SCRIPTS = ["install", "typecheck", "lint", "build", "test"]


def run_check(session_id: str, check_type: str) -> dict:
    """Run a single check and return standardized result."""
    pm = detect_package_manager(session_id)
    package_exists, scripts = _load_package_metadata(session_id)
    command = _build_check_command(pm, check_type, scripts, package_exists)
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

def _load_package_metadata(session_id: str) -> tuple[bool, dict]:
    from src.services.workspace_exec import read_file

    ok, content = read_file(session_id, "package.json")
    if not ok:
        return False, {}
    try:
        package_json = json.loads(content)
        scripts = package_json.get("scripts", {})
        return True, scripts if isinstance(scripts, dict) else {}
    except json.JSONDecodeError:
        return True, {}


def _build_check_command(pm: str, check_type: str, scripts: dict, package_exists: bool) -> str:
    # Use the appropriate package manager
    prefix = {
        "yarn": "yarn",
        "pnpm": "pnpm",
        "npm": "npm run",
    }.get(pm, "npm run")

    if check_type == "install":
        if not package_exists:
            return ""
        return {"yarn": "yarn install", "pnpm": "pnpm install", "npm": "npm install"}.get(pm, "npm install")

    script_map = {
        "typecheck": ["typecheck", "tsc", "ts-check"],
        "lint": ["lint"],
        "test": ["test", "test:unit"],
        "build": ["build"],
    }

    candidates = script_map.get(check_type, [])
    for script in candidates:
        if script in scripts:
            return f"{prefix} {script}"

    return ""
