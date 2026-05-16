import os
import subprocess
import tempfile
from typing import Optional, Tuple
from src.config import settings

SAFE_COMMANDS = {
    "npm", "npx", "node", "yarn", "pnpm",
    "python", "python3", "pip", "pip3", "uvicorn",
    "git", "ls", "cat", "echo", "mkdir", "touch", "cp", "mv",
    "rm", "find", "grep", "head", "tail", "wc",
    "git status", "git diff", "git log", "git add", "git commit",
    "git stash", "git branch", "git checkout",
    "playwright", "pytest",
}

NPM_CHECK_SCRIPTS = ["typecheck", "build", "lint", "test", "dev"]


def _workspace_path(session_id: str) -> str:
    return os.path.join(settings.workspace_base_dir, session_id)


def run_command(
    session_id: str,
    command: str,
    cwd: Optional[str] = None,
    timeout: int = 60,
    env: Optional[dict] = None,
) -> Tuple[int, str, str]:
    workspace = _workspace_path(session_id)
    target_cwd = cwd or workspace
    os.makedirs(target_cwd, exist_ok=True)

    result = subprocess.run(
        command,
        shell=True,
        cwd=target_cwd,
        capture_output=True,
        text=True,
        timeout=timeout,
        env={**os.environ, **(env or {})},
    )
    return result.returncode, result.stdout, result.stderr


def detect_package_manager(session_id: str, cwd: str = "") -> str:
    workspace = _workspace_path(session_id)
    target = os.path.join(workspace, cwd)
    if os.path.exists(os.path.join(target, "yarn.lock")):
        return "yarn"
    if os.path.exists(os.path.join(target, "pnpm-lock.yaml")):
        return "pnpm"
    return "npm"


def read_file(session_id: str, file_path: str, max_size: int = 1_000_000) -> Tuple[bool, str]:
    workspace = _workspace_path(session_id)
    full_path = os.path.join(workspace, file_path)

    # Safety: ensure path is within workspace
    real_workspace = os.path.realpath(workspace)
    real_target = os.path.realpath(full_path)
    if not real_target.startswith(real_workspace):
        return False, f"Path {file_path} is outside workspace"

    if not os.path.exists(real_target):
        return False, f"File not found: {file_path}"

    size = os.path.getsize(real_target)
    if size > max_size:
        return False, f"File too large ({size} bytes > {max_size})"

    try:
        with open(real_target, "r", encoding="utf-8", errors="replace") as f:
            return True, f.read()
    except Exception as e:
        return False, f"Read error: {e}"


def write_file(session_id: str, file_path: str, content: str) -> Tuple[bool, str]:
    workspace = _workspace_path(session_id)
    full_path = os.path.join(workspace, file_path)

    # Safety: ensure path is within workspace
    real_workspace = os.path.realpath(workspace)
    real_target = os.path.realpath(full_path)
    if not real_target.startswith(real_workspace):
        return False, f"Path {file_path} is outside workspace"

    # Ensure parent directory exists
    os.makedirs(os.path.dirname(real_target), exist_ok=True)

    try:
        with open(real_target, "w", encoding="utf-8") as f:
            f.write(content)
        return True, f"Written {len(content)} bytes to {file_path}"
    except Exception as e:
        return False, f"Write error: {e}"
