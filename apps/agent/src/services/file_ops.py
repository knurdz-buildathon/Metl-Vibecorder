import os
from typing import Tuple
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


def safe_delete_file(session_id: str, relative_path: str) -> Tuple[bool, str]:
    """Delete a file in workspace with safety checks."""
    if not is_allowed_path(relative_path):
        return False, f"Path not allowed: {relative_path}"

    from src.services.workspace_exec import delete_file
    return delete_file(session_id, relative_path)


def safe_list_files(session_id: str, relative_dir: str = ".") -> Tuple[bool, list]:
    base = os.path.join(os.environ.get("WORKSPACE_BASE_DIR", "/workspace-volumes"), session_id)
    repo = os.path.join(base, "repo")
    workspace = repo if os.path.isdir(repo) else base
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
    """Create a git stash restore point without committing user changes."""
    rc, out, err = run_command(session_id, "git rev-parse --is-inside-work-tree")
    if rc != 0:
        return False, f"Workspace is not a git repo: {err or out}"

    rc, out, err = run_command(session_id, "git status --porcelain")
    if rc != 0:
        return False, f"Could not inspect git status: {err or out}"
    if not out.strip():
        return True, f"No local changes to stash for restore point: {label}"

    rc, out, err = run_command(
        session_id,
        f'git stash push -u -m "vibecoder-restore-{label}-{session_id[:8]}"',
    )
    if rc == 0:
        return True, f"Restore point created: {label}"
    return False, f"Failed to create restore point: {err or out}"


def safe_git_status(session_id: str) -> Tuple[bool, str]:
    rc, out, _err = run_command(session_id, "git status --short")
    return rc == 0, out


def safe_git_diff(session_id: str) -> Tuple[bool, str]:
    rc, out, _err = run_command(session_id, "git diff")
    return rc == 0, out
