import json

from src.agents import vibecoder_agent
from src.agents.vibecoder_agent import VibeCoderAgent
from src.services import workspace_exec


def test_parse_and_apply_json_file_edits(monkeypatch, tmp_path):
    session_id = "test-session"
    workspace = tmp_path / session_id
    workspace.mkdir()

    monkeypatch.setenv("WORKSPACE_BASE_DIR", str(tmp_path))
    monkeypatch.setattr(workspace_exec.settings, "workspace_base_dir", str(tmp_path))
    monkeypatch.setattr(vibecoder_agent, "publish_event", lambda *_args, **_kwargs: True)

    response = json.dumps(
        {
            "reasoning": "create one file",
            "file_edits": [
                {
                    "path": "src/app.ts",
                    "content": "export const answer = 42;\n",
                    "operation": "create",
                }
            ],
            "completion_status": "done",
        }
    )

    edits = VibeCoderAgent(session_id)._parse_and_apply_file_edits(response)

    assert edits == [{"path": "src/app.ts", "operation": "created"}]
    assert (workspace / "src" / "app.ts").read_text() == "export const answer = 42;\n"


def test_parse_and_apply_fenced_json_file_edits(monkeypatch, tmp_path):
    session_id = "test-session"
    workspace = tmp_path / session_id
    workspace.mkdir()

    monkeypatch.setenv("WORKSPACE_BASE_DIR", str(tmp_path))
    monkeypatch.setattr(workspace_exec.settings, "workspace_base_dir", str(tmp_path))
    monkeypatch.setattr(vibecoder_agent, "publish_event", lambda *_args, **_kwargs: True)

    response = """```json
{"file_edits":[{"path":"README.md","content":"# Hello\\n","operation":"create"}]}
```"""

    edits = VibeCoderAgent(session_id)._parse_and_apply_file_edits(response)

    assert edits == [{"path": "README.md", "operation": "created"}]
    assert (workspace / "README.md").read_text() == "# Hello\n"
