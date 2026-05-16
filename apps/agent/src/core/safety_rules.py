import os

DISALLOWED_PATTERNS = [
    "**/.env",
    "**/.env.*",
    ".git/**",
    "**/.git/**",
    "**/secrets",
    "**/secrets/**",
]

SECRET_KEYWORDS = [
    "API_KEY",
    "SECRET",
    "PASSWORD",
    "PRIVATE_KEY",
    "TOKEN",
]


def is_allowed_path(file_path: str) -> bool:
    """Check if a file path is allowed to be edited or read."""
    normalized = os.path.normpath(file_path)
    for pattern in DISALLOWED_PATTERNS:
        # Simple wildcard matching
        parts = pattern.replace("**", "").strip("/").split("/")
        normalized_parts = normalized.strip("/").split("/")
        if "**" in pattern:
            # Check suffix match for **/pattern patterns
            suffix = normalized.strip("/").endswith(parts[-1]) if parts[-1] else False
            if suffix:
                return False
        elif normalized.strip("/").startswith(pattern.strip("/")):
            return False
    return True


def contains_secrets(content: str) -> bool:
    """Check if content may contain exposed secrets."""
    for keyword in SECRET_KEYWORDS:
        if keyword in content:
            return True
    return False
