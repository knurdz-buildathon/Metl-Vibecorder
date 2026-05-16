import json
import re
from typing import Optional
from src.config import settings
from src.core.internal_docs import DocManager
from src.services.gemini_client import gemini_client
from src.services.prompt_engine import assemble_prompt, get_prompt_version
from src.services.file_ops import (
    safe_create_restore_point,
    safe_delete_file,
    safe_git_diff,
    safe_list_files,
    safe_read_file,
    safe_write_file,
)
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

    def _parse_response_json(self, response: str) -> Optional[dict]:
        """Parse raw or fenced JSON returned by the model."""
        text = response.strip()
        fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
        if fenced:
            text = fenced.group(1).strip()
        try:
            payload = json.loads(text)
            return payload if isinstance(payload, dict) else None
        except json.JSONDecodeError:
            return None

    def _response_text(self, response: str, *keys: str) -> str:
        payload = self._parse_response_json(response)
        if not payload:
            return response

        for key in keys:
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value
            if isinstance(value, (dict, list)):
                return json.dumps(value, indent=2)

        for key in ("answer", "summary", "quality_summary", "plan"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value
            if isinstance(value, (dict, list)):
                return json.dumps(value, indent=2)
        return response

    def _parse_and_apply_file_edits(self, response: str) -> list[dict]:
        """Parse structured file edits from the LLM response and apply them safely."""
        edits = []
        payload = self._parse_response_json(response)

        if payload and isinstance(payload.get("file_edits"), list):
            for edit in payload["file_edits"]:
                if not isinstance(edit, dict):
                    continue
                file_path = str(edit.get("path") or "").strip()
                operation = str(edit.get("operation") or "modify").lower()
                content = edit.get("content")
                if not file_path:
                    continue

                if operation == "delete":
                    ok, msg = safe_delete_file(self.session_id, file_path)
                    normalized_op = "deleted"
                else:
                    if content is None:
                        logger.error(f"Skipping edit without content for {file_path}")
                        continue
                    exists_ok, _ = safe_read_file(self.session_id, file_path)
                    normalized_op = "modified" if exists_ok else "created"
                    ok, msg = safe_write_file(self.session_id, file_path, str(content))

                if ok:
                    publish_event(self.session_id, "file_change", {
                        "file_path": file_path,
                        "operation": normalized_op,
                    })
                    edits.append({"path": file_path, "operation": normalized_op})
                else:
                    logger.error(f"Failed to apply edit for {file_path}: {msg}")

        if edits:
            return edits

        # Legacy fallback for older prompt responses: ```file:path blocks.
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
        message = self._response_text(response, "answer")
        publish_event(self.session_id, "agent_complete", {"mode": "ask"})
        return {
            "status": "ok",
            "mode": "ask",
            "answer": message,
            "message": message,
            "completion_status": "done",
        }

    async def plan(self, user_prompt: str) -> dict:
        publish_event(self.session_id, "agent_start", {"mode": "plan"})
        context = self._build_project_context(".")
        prompt = assemble_prompt("plan", user_prompt, project_context=context)
        response = await gemini_client.generate(prompt)
        plan_text = self._response_text(response, "plan")
        publish_event(self.session_id, "agent_complete", {"mode": "plan"})

        # Save plan
        self.doc_manager.upsert_implementation_plan(self.session_id, plan_text)
        version = get_prompt_version("plan")
        self.doc_manager.upsert_super_prompt_version(self.session_id, json.dumps(version, indent=2))

        return {
            "status": "ok",
            "mode": "plan",
            "plan": plan_text,
            "message": plan_text,
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
        payload = self._parse_response_json(response) or {}

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
            "message": self._response_text(response, "summary"),
            "summary": payload.get("summary") or "Agent mode completed.",
            "files_changed": files_changed,
            "commands_run": [
                cmd.get("command", "") if isinstance(cmd, dict) else str(cmd)
                for cmd in payload.get("commands", [])
            ],
            "tests_to_run": [
                test.get("command", "") if isinstance(test, dict) else str(test)
                for test in payload.get("tests", [])
            ],
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
        payload = self._parse_response_json(response) or {}

        files_changed = self._parse_and_apply_file_edits(response)

        # Save fix notes
        notes = self.doc_manager.read_doc(self.session_id, "fix-notes.md") or ""
        notes += f"\n\n## Repair Attempt {attempt}\n{self._response_text(response, 'summary', 'root_cause')}\n"
        self.doc_manager.upsert_fix_notes(self.session_id, notes)

        # Re-run checks
        check_results = run_all_checks(self.session_id)
        failed = [c for c in check_results if c["status"] == "failed"]

        return {
            "status": "ok",
            "fixed": len(failed) == 0,
            "attempt": attempt,
            "message": self._response_text(response, "summary", "root_cause"),
            "summary": payload.get("summary") or self._response_text(response, "root_cause"),
            "files_changed": files_changed,
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
        payload = self._parse_response_json(response) or {}
        summary = self._response_text(response, "quality_summary", "summary")
        publish_event(self.session_id, "agent_complete", {"mode": "review"})

        # Save final report
        self.doc_manager.upsert_final_report(self.session_id, summary)

        return {
            "status": "ok",
            "mode": "review",
            "message": summary,
            "summary": summary,
            "risks": payload.get("risks", []),
            "readiness": payload.get("readiness", "ready_for_review"),
            "check_results": check_results,
            "completion_status": "done",
        }
