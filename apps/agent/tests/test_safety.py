import pytest
from src.core.safety_rules import is_allowed_path, is_safe_command, contains_secrets


def test_is_allowed_path_blocks_env():
    assert is_allowed_path(".env") == False
    assert is_allowed_path("src/utils/.env") == False
    assert is_allowed_path("app/.env.local") == False


def test_is_allowed_path_blocks_git():
    assert is_allowed_path(".git/config") == False
    assert is_allowed_path(".git/hooks/pre-commit") == False


def test_is_allowed_path_allows_source():
    assert is_allowed_path("src/main.ts") == True
    assert is_allowed_path("app/page.tsx") == True
    assert is_allowed_path("package.json") == True


def test_is_safe_command_blocks_dangerous():
    assert is_safe_command("rm -rf /") == False
    assert is_safe_command("git push --force") == False
    assert is_safe_command("git reset --hard HEAD") == False


def test_is_safe_command_allows_safe():
    assert is_safe_command("npm run build") == True
    assert is_safe_command("git status") == True
    assert is_safe_command("git add -A") == True


def test_contains_secrets():
    assert contains_secrets("API_KEY=secret123") == True
    assert contains_secrets("normal content") == False
