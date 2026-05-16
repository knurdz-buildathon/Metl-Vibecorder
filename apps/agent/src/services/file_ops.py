import os
import json
from typing import Optional, Tuple
from src.core.safety_rules import is_allowed_path
from src.services.workspace_exec import run_command

def safe_read_file(session_id: str, relative_path: str, max_size: int = 1_000_000) -> Tuple[bool, str]:
    """Read a file from workspace with safety checks."""
    if not is_allowed_path(relative_path):
        return False, f"Path not allowed: {relative_path}"

    from src.services.workspace_exec import read_file
    return read_file(session_id, relative_path, max_size)


def safe_write_file(session_id: str, relative_path: str, content: str) -> Tuple[bool, str]:
    """Write a file in workspace with safety checks."""
    if not is_allowed_path(relative_path):
        return False, f"Path not allowed: {relative_path}"

    from src.services.workspace_exec import write_file
    return write_file(session_id, relative_path, content)


def safe_list_files(session_id: str, relative_dir: str = ".") -> Tuple[bool, list]:
    workspace = os.path.join(os.environ.get("WORKSPACE_BASE_DIR", "/workspace-volumes"), session_id)
    target = os.path.join(workspace, relative_dir)

    if not os.path.exists(target):
        return False, []

    try:
        files = []
        for root, dirs, filenames in os.walk(target):
            # Skip hidden and internal dirs
            dirs[:] = [
                d for d in dirs
                if not d.startswith(".") and d != "node_modules" and d != "__pycache__"
            ]
            for f in filenames:
                full = os.path.relpath(os.path.join(root, f), workspace)
                if is_allowed_path(full):
                    files.append(full)
        files.sort()
        return True, files
    except Exception as e:
        return False, []


def safe_create_restore_point(session_id: str, label: str = "auto") -> Tuple[bool, str]:
    """Create a git stash as a restore point."""
    rc, out, err = run_command(session_id, 
        f'git stash push -m "vibecoder-restore-{label}-{session_id[:8]}"'
    )
    if rc == 0 or "No local changes" in err:
        # Also try to make a commit if there are changes
        run_command(session_id, "git add -A")
        run_command(session_id, 
            f'git commit -m "vibecoder-autosave-{label}" || true'
        )
        return True, f"Restore point created: {label}"
    return False, f"Failed to create restore point: {err}"


def safe_git_status(session_id: str) -> Tuple[bool, str]:
    rc, out, _err = run_command(session_id, "git status --short")
    return rc == 0, out


def safe_git_diff(session_id: str) -> Tuple[bool, str]:
    rc, out, _err = run_command(session_id, "git diff --stat")
    return rc == 0, out
