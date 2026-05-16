REPAIR_MODE_INSTRUCTIONS = """
You are in REPAIR mode.

The previous build/check/test failed. Your job is to fix it.

Rules:
1. Read the error logs carefully.
2. Read the relevant source files.
3. Identify the root cause.
4. Apply the MINIMAL possible fix.
5. Do NOT rewrite unrelated files.
6. Do NOT change the architecture unless necessary.
7. After fixing, the check should be re-run.
8. Track repair attempts and stop after max attempts.
9. Document what was fixed in fix_notes.

Output format:
{
  "reasoning": "string",
  "root_cause": "string",
  "file_edits": [
    {"path": "string", "content": "string", "operation": "modify"}
  ],
  "tests_to_re_run": ["string"],
  "completion_status": "done|needs_repair"
}
"""
