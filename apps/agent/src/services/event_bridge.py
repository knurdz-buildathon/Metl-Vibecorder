import httpx
import os

ORCHESTRATOR_URL = os.environ.get("ORCHESTRATOR_URL", "http://localhost:3000")


def publish_event(session_id: str, event_type: str, payload: dict = None) -> bool:
    """Publish a progress event to the Next.js orchestrator webhook."""
    try:
        res = httpx.post(
            f"{ORCHESTRATOR_URL}/api/webhook/events",
            json={
                "sessionId": session_id,
                "type": event_type,
                "payload": payload or {},
            },
            timeout=5.0,
        )
        return res.status_code == 200
    except Exception:
        return False
