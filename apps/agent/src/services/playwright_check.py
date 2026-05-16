import os
from typing import Optional, Tuple
from src.services.workspace_exec import run_command
from src.services.logger import logger


async def run_playwright_smoke_test(
    session_id: str,
    url: str = "http://localhost:3000",
    timeout: int = 30,
) -> dict:
    """Run a basic Playwright smoke test against a URL."""
    workspace = os.path.join(os.environ.get("WORKSPACE_BASE_DIR", "/workspace-volumes"), session_id)

    script = f"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            response = await page.goto('{url}', timeout={timeout * 1000})
            if response and response.ok:
                console_errors = []
                page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
                await page.wait_for_timeout(1000)
                screenshot_path = '{workspace}/playwright-screenshot.png'
                await page.screenshot(path=screenshot_path, full_page=True)
                await browser.close()
                print('PASS')
                print(f'Status: {{response.status}}')
                print(f'Console errors: {{len(console_errors)}}')
                if console_errors:
                    for e in console_errors[:5]:
                        print(f'  - {{e}}')
            else:
                print('FAIL')
                print(f'Status: {{response.status if response else "no response"}}')
                await browser.close()
        except Exception as e:
            print('FAIL')
            print(str(e))
            await browser.close()

asyncio.run(main())
"""

    script_path = os.path.join(workspace, "playwright_smoke.py")
    with open(script_path, "w") as f:
        f.write(script)

    rc, stdout, stderr = run_command(
        session_id,
        f"python3 {script_path}",
        timeout=timeout + 15,
    )

    passed = "PASS" in stdout and rc == 0
    logger.info(
        "playwright_smoke",
        session_id=session_id,
        url=url,
        passed=passed,
        return_code=rc,
    )

    return {
        "type": "playwright",
        "status": "passed" if passed else "failed",
        "command": f"python3 playwright_smoke.py",
        "stdout": stdout,
        "stderr": stderr,
    }
