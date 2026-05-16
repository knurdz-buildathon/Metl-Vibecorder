import hashlib
from datetime import datetime
from typing import Optional
from src.config import settings
from src.prompts.super_prompt import SUPER_PROMPT
from src.prompts.ask_prompt import ASK_MODE_INSTRUCTIONS
from src.prompts.plan_prompt import PLAN_MODE_INSTRUCTIONS
from src.prompts.agent_prompt import AGENT_MODE_INSTRUCTIONS
from src.prompts.repair_prompt import REPAIR_MODE_INSTRUCTIONS
from src.prompts.review_prompt import REVIEW_MODE_INSTRUCTIONS


MODE_PROMPTS = {
    "ask": ASK_MODE_INSTRUCTIONS,
    "plan": PLAN_MODE_INSTRUCTIONS,
    "agent": AGENT_MODE_INSTRUCTIONS,
    "repair": REPAIR_MODE_INSTRUCTIONS,
    "review": REVIEW_MODE_INSTRUCTIONS,
}


def assemble_prompt(
    mode: str,
    user_prompt: str,
    project_context: Optional[str] = None,
    current_diff: Optional[str] = None,
    check_results: Optional[str] = None,
    mode_prompt: Optional[str] = None,
) -> str:
    parts = [SUPER_PROMPT]

    mode_instructions = mode_prompt or MODE_PROMPTS.get(mode, "")
    if mode_instructions:
        parts.append(f"\n---\n{mode_instructions}\n---\n")

    if project_context:
        parts.append(f"\n## Project Context\n{project_context}\n")

    if current_diff:
        parts.append(f"\n## Current Diff\n{current_diff}\n")

    if check_results:
        parts.append(f"\n## Check Results\n{check_results}\n")

    parts.append(f"\n## User Request\n{user_prompt}\n")
    parts.append("\n## Response\n")

    return "\n".join(parts)


def compute_prompt_hash(prompt_text: str) -> str:
    return hashlib.sha256(prompt_text.encode()).hexdigest()[:16]


def get_prompt_version(mode: str, model: Optional[str] = None) -> dict:
    """Return version metadata for the current prompt configuration."""
    prompt_text = MODE_PROMPTS.get(mode, "")
    return {
        "version": "0.1.0",
        "hash": compute_prompt_hash(SUPER_PROMPT + prompt_text),
        "model": model or settings.gemini_model,
        "mode": mode,
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }
