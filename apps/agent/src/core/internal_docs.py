import os
from typing import Optional

from src.config import settings


class DocManager:
    def __init__(self, base_dir: str = None):
        # Store internal docs in agent's own workspace area, NOT inside user workspace
        # This prevents internal docs from being committed into user repos
        self.base_dir = base_dir or os.path.join(
            settings.workspace_base_dir, "_internal_docs"
        )

    def _session_path(self, session_id: str) -> str:
        return os.path.join(self.base_dir, session_id)

    def _ensure_dir(self, session_id: str):
        path = self._session_path(session_id)
        os.makedirs(path, exist_ok=True)
        return path

    def write_doc(self, session_id: str, name: str, content: str) -> str:
        dir_path = self._ensure_dir(session_id)
        file_path = os.path.join(dir_path, name)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return file_path

    def read_doc(self, session_id: str, name: str) -> Optional[str]:
        file_path = os.path.join(self._session_path(session_id), name)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        return None

    def upsert_project_context(self, session_id: str, content: str) -> str:
        return self.write_doc(session_id, "project-context.md", content)

    def upsert_implementation_plan(self, session_id: str, content: str) -> str:
        return self.write_doc(session_id, "implementation-plan.md", content)

    def upsert_fix_notes(self, session_id: str, content: str) -> str:
        return self.write_doc(session_id, "fix-notes.md", content)

    def upsert_final_report(self, session_id: str, content: str) -> str:
        return self.write_doc(session_id, "final-report.md", content)

    def upsert_session_state(self, session_id: str, state_json: str) -> str:
        return self.write_doc(session_id, "session-state.json", state_json)

    def upsert_super_prompt_version(self, session_id: str, content: str) -> str:
        return self.write_doc(session_id, "super-prompt-version.json", content)
