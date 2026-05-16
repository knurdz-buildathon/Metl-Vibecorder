import os
import fnmatch

DISALLOWED_PATTERNS = [
    "**/.env",
    "**/.env.*",
    "**/.git/**",
    "**/.git",
    "**/node_modules/**",
    "**/node_modules",
    "**/__pycache__/**",
    "**/__pycache__",
    "**/.metl-vibecoder",
    "**/.metl-vibecoder/**",
    "**/secrets/**",
    "**/secrets",
]

DANGEROUS_COMMANDS = [
    "rm -rf /",
    "rm -rf ~",
    ":(){ :|:& };:",
    "chmod -R 777 /",
    "dd if=/dev/zero",
    "> /dev/sda",
    "mkfs",
    "curl",
    "wget -O- | bash",
]

SECRET_KEYWORDS = [
    "API_KEY",
    "SECRET",
    "PASSWORD",
    "PRIVATE_KEY",
    "TOKEN",
]


def _matches_pattern(file_path: str, pattern: str) -> bool:
    normalized = os.path.normpath(file_path).strip("/")
    # Handle **/prefix patterns
    if pattern.startswith("**/"):
        suffix = pattern[3:]  # Strip **/
        return fnmatch.fnmatch(normalized, suffix) or any(
            fnmatch.fnmatch(part, suffix) for part in normalized.split("/")
        ) or normalized.endswith(suffix)
    # Handle prefix/** patterns
    if pattern.endswith("/**"):
        prefix = pattern[:-3]
        return normalized.startswith(prefix.rstrip("/"))
    return fnmatch.fnmatch(normalized, pattern)


def is_allowed_path(file_path: str) -> bool:
    """Check if a file path is allowed to be edited or read.

    Blocks:
    - .env files (including nested like src/utils/.env)
    - .git directories and contents
    - node_modules
    - __pycache__
    - Internal Metl-VibeCoder documents
    - secrets directories
    """
    normalized = os.path.normpath(file_path).strip("/")
    for pattern in DISALLOWED_PATTERNS:
        if _matches_pattern(normalized, pattern):
            return False
    return True


def is_safe_command(command: str) -> bool:
    """Reject obviously dangerous shell commands."""
    cmd_lower = command.lower()
    for dangerous in DANGEROUS_COMMANDS:
        if dangerous.lower() in cmd_lower:
            return False
    # Reject force git operations
    if "git" in cmd_lower:
        if "--force" in cmd_lower or "-f" in cmd_lower.split():
            return False
        if "reset --hard" in cmd_lower:
            return False
        if "push --force" in cmd_lower or "push -f" in cmd_lower:
            return False
    return True


def contains_secrets(content: str) -> bool:
    """Check if content may contain exposed secrets."""
    for keyword in SECRET_KEYWORDS:
        if keyword in content:
            return True
    return False
