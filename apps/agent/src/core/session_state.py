from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class SessionMode(str, Enum):
    ASK = "ask"
    PLAN = "plan"
    AGENT = "agent"
    REPAIR = "repair"
    REVIEW = "review"


class SessionStatus(str, Enum):
    IDLE = "idle"
    PLANNING = "planning"
    AWAITING_APPROVAL = "awaiting_approval"
    GENERATING = "generating"
    RUNNING_CHECKS = "running_checks"
    REPAIRING = "repairing"
    DONE = "done"
    ERROR = "error"


class SessionState(BaseModel):
    session_id: str
    mode: SessionMode
    status: SessionStatus
    user_prompt: str
    project_context: Optional[str] = None
    implementation_plan: Optional[str] = None
    fix_notes: List[str] = []
    repair_attempts: int = 0
    max_repair_attempts: int = 3
    files_changed: List[dict] = []
    checks_run: List[dict] = []
