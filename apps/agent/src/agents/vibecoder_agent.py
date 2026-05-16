import json
import time
from typing import Optional
from src.config import settings
from src.core.session_state import SessionState, SessionMode, SessionStatus
from src.core.internal_docs import DocManager
from src.services.gemini_client import gemini_client
from src.services.prompt_engine import assemble_prompt, get_prompt_version
from src.services.file_ops import safe_read_file, safe_write_file, safe_list_files, safe_create_restore_point, safe_git_diff, safe_git_status
from src.services.workspace_exec import run_command
from src.services.check_runner import run_all_checks
from src.services.logger import logger


from src.services.event_bridge import publish_event


class VibeCoderAgent:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.doc_manager = DocManager()

    def _build_project_context(self, repo_path: str) -> str:
        ok, files = safe_list_files(self.session_id)
        if not ok:
            return "Could not list files."

        context_parts = ["## File Structure"]
        for f in files[:50]:  # Limit for now
            context_parts.append(f"- {f}")

        # Read key config files
        key_files = ["package.json", "README.md", "pyproject.toml", "requirements.txt"]
        for key_file in key_files:
            ok, content = safe_read_file(self.session_id, key_file)
            if ok:
                context_parts.append(f"\n## {key_file}\n```\n{content[:2000]}\n```")

        return "\n".join(context_parts)

    def _parse_and_apply_file_edits(self, response: str) -> list[dict]:
        """Parse code block file edits from the LLM response and write them to disk."""
        import re

        edits = []
        # Look for ```file:<path> blocks
        pattern = r"```file:([^\n`]+)\n(.*?)```"
        matches = re.findall(pattern, response, re.DOTALL)

        for file_path, content in matches:
            file_path = file_path.strip()
            content = content.strip()
            if not file_path:
                continue

            exists_ok, _ = safe_read_file(self.session_id, file_path)
            op = "modified" if exists_ok else "created"

            ok, msg = safe_write_file(self.session_id, file_path, content)
            if ok:
                publish_event(self.session_id, "file_change", {
                    "file_path": file_path,
                    "operation": op,
                })
                edits.append({"path": file_path, "operation": op})
            else:
                logger.error(f"Failed to write {file_path}: {msg}")

        return edits

    async def ask(self, user_prompt: str) -> dict:
        publish_event(self.session_id, "agent_start", {"mode": "ask"})
        context = self._build_project_context(".")
        prompt = assemble_prompt("ask", user_prompt, project_context=context)
        response = await gemini_client.generate(prompt)
        publish_event(self.session_id, "agent_complete", {"mode": "ask"})
        return {
            "status": "ok",
            "mode": "ask",
            "answer": response,
            "message": response,
            "completion_status": "done",
        }

    async def plan(self, user_prompt: str) -> dict:
        publish_event(self.session_id, "agent_start", {"mode": "plan"})
        context = self._build_project_context(".")
        prompt = assemble_prompt("plan", user_prompt, project_context=context)
        response = await gemini_client.generate(prompt)
        publish_event(self.session_id, "agent_complete", {"mode": "plan"})

        # Save plan
        self.doc_manager.upsert_implementation_plan(self.session_id, response)
        version = get_prompt_version("plan")
        self.doc_manager.upsert_super_prompt_version(self.session_id, json.dumps(version, indent=2))

        return {
            "status": "ok",
            "mode": "plan",
            "plan": response,
            "message": response,
            "prompt_version": version,
            "completion_status": "needs_approval",
        }

    async def agent(self, user_prompt: str, approved_plan: Optional[str] = None) -> dict:
        publish_event(self.session_id, "agent_start", {"mode": "agent"})
        # Create restore point
        safe_create_restore_point(self.session_id, "agent-start")

        context = self._build_project_context(".")
        plan_context = approved_plan or "No pre-approved plan. Plan internally then implement."
        prompt = assemble_prompt(
            "agent",
            user_prompt,
            project_context=context,
            mode_prompt=plan_context,
        )

        response = await gemini_client.generate(prompt)
        publish_event(self.session_id, "agent_complete", {"mode": "agent"})

        # Extract file edits from response and apply them
        files_changed = self._parse_and_apply_file_edits(response)

        # Run checks
        check_results = run_all_checks(self.session_id)
        failed = [c for c in check_results if c["status"] == "failed"]

        # Save context and report
        self.doc_manager.upsert_project_context(self.session_id, context)
        version = get_prompt_version("agent")
        self.doc_manager.upsert_super_prompt_version(self.session_id, json.dumps(version, indent=2))

        return {
            "status": "ok",
            "mode": "agent",
            "message": response,
            "summary": "Agent mode completed.",
            "files_changed": files_changed,
            "check_results": check_results,
            "needs_repair": len(failed) > 0,
            "completion_status": "needs_repair" if failed else "done",
        }

    async def repair(self, error_logs: str, attempt: int = 1) -> dict:
        publish_event(self.session_id, "agent_start", {"mode": "repair", "attempt": attempt})
        if attempt > settings.vibecoder_max_repair_attempts:
            return {
                "status": "error",
                "fixed": False,
                "message": f"Max repair attempts ({settings.vibecoder_max_repair_attempts}) reached.",
                "summary": f"Max repair attempts ({settings.vibecoder_max_repair_attempts}) reached.",
                "completion_status": "done",
            }

        ok, diff = safe_git_diff(self.session_id)
        prompt = assemble_prompt("repair", "Fix the build/test failure", current_diff=diff, check_results=error_logs)
        response = await gemini_client.generate(prompt)
        publish_event(self.session_id, "agent_complete", {"mode": "repair", "attempt": attempt})

        # Save fix notes
        notes = self.doc_manager.read_doc(self.session_id, "fix-notes.md") or ""
        notes += f"\n\n## Repair Attempt {attempt}\n{response}\n"
        self.doc_manager.upsert_fix_notes(self.session_id, notes)

        # Re-run checks
        check_results = run_all_checks(self.session_id)
        failed = [c for c in check_results if c["status"] == "failed"]

        return {
            "status": "ok",
            "fixed": len(failed) == 0,
            "attempt": attempt,
            "message": response,
            "summary": response,
            "check_results": check_results,
            "completion_status": "done" if len(failed) == 0 else "needs_repair",
        }

    async def review(self, files_changed: list) -> dict:
        publish_event(self.session_id, "agent_start", {"mode": "review"})
        ok, diff = safe_git_diff(self.session_id)

        check_results = run_all_checks(self.session_id)
        check_results_text = ""
        for cr in check_results:
            check_results_text += f"\n[{cr['type'].upper()}] {cr['status']}\nCommand: {cr['command']}\n"
            if cr.get("stdout"):
                check_results_text += f"Stdout:\n{cr['stdout'][:2000]}\n"
            if cr.get("stderr"):
                check_results_text += f"Stderr:\n{cr['stderr'][:2000]}\n"

        prompt = assemble_prompt("review", "Review the final code changes", current_diff=diff, check_results=check_results_text)
        response = await gemini_client.generate(prompt)
        publish_event(self.session_id, "agent_complete", {"mode": "review"})

        # Save final report
        self.doc_manager.upsert_final_report(self.session_id, response)

        return {
            "status": "ok",
            "mode": "review",
            "message": response,
            "summary": response,
            "check_results": check_results,
            "completion_status": "done",
        }
