# Metl Web Test Lab

Standalone browser-testing project for Metl. It uses Browser-Use to drive the browser, Azure OpenAI for accurate agent-style exploration, and Playwright for repeatable smoke checks.

## What This Gives You

- Accurate browser agent testing with Azure OpenAI / Azure AI Foundry.
- Free local fallback testing with Ollama when you do not want to spend credit.
- Deterministic Playwright smoke checks for repeatable verification.
- JSON and Markdown reports under `reports/`.
- A path to run the same setup later on a GCP or Azure VM.

## Accuracy Modes

Browser-Use has its own hosted model and API key, but you do not need that hosted service for this setup. It has a limited free allowance for new users and then becomes paid. Since you have Azure credit, use Azure OpenAI instead.

Use this order:

1. Playwright smoke checks for repeatable local testing.
2. Azure OpenAI for accurate exploratory browser-agent testing.
3. Ollama only for cheap/private rough exploration.

Provider examples:

```bash
# Strong Azure OpenAI / Azure AI Foundry model using Azure credit.
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com \
AZURE_OPENAI_API_KEY=your_key \
AZURE_OPENAI_DEPLOYMENT=your-deployment-name \
python -m web_test.agent --provider azure --model gpt-5.2 --headed

# Free/local fallback, lower accuracy.
python -m web_test.agent --provider ollama --model qwen2.5:7b-instruct --headed
```

For Azure, first deploy a model in Azure AI Foundry or Azure OpenAI Studio, then set:

```env
LLM_PROVIDER=azure
LLM_MODEL=Kimi-K2.6
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_DEPLOYMENT=Kimi-K2.6
AZURE_OPENAI_API_VERSION=2025-03-01-preview
AZURE_OPENAI_USE_RESPONSES_API=auto
```

`AZURE_OPENAI_DEPLOYMENT` is the deployment name in your Azure resource. It can be different from the model name. The doctor command now checks this before opening the browser, so a wrong deployment name fails fast instead of retrying the agent six times.

Good Azure model choices for browser testing:

- `Kimi-K2.6`: strongest choice from the four Foundry models you listed for agentic/browser-testing work.
- `gpt-5.2`: strong Azure OpenAI fallback if deployed in your region.
- `gpt-5.4` or `gpt-5.5`: try these if your Azure region and quota allow them.
- `o4-mini`: cheaper/faster reasoning fallback.

## Setup

This is a Python project, not an npm project. Do not run `npm i` inside `web-test/`.

Fast Mac setup:

```bash
cd /Users/sadeepaherath/Downloads/MetlCode/MetlCode/web-test
chmod +x scripts/setup_mac.sh
./scripts/setup_mac.sh
```

Manual setup:

Install Ollama from [ollama.com](https://ollama.com), or with Homebrew:

```bash
brew install ollama
brew services start ollama
```

Then pull a model:

```bash
ollama pull qwen2.5:7b-instruct
```

If `python -m web_test.doctor` says Ollama is not reachable, start it again:

```bash
brew services start ollama
```

If Qwen is weak on browser actions, try:

```bash
ollama pull llama3.1:8b
```

Create the Python environment:

```bash
cd /Users/sadeepaherath/Downloads/MetlCode/MetlCode/web-test
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
python -m playwright install chromium
cp .env.example .env
```

Start your app separately, usually:

```bash
cd /Users/sadeepaherath/Downloads/MetlCode/MetlCode/apps/web
npm run dev
```

## Run Checks

Doctor:

```bash
python -m web_test.doctor
```

Deterministic smoke check:

```bash
python -m web_test.smoke --url http://localhost:3000
```

Agent-style exploration:

```bash
python -m web_test.agent --url http://localhost:3000 --headed --task "Explore the app like a QA tester. Find broken buttons, forms, navigation, and confusing flows."
```

Use a different local model:

```bash
python -m web_test.agent --model llama3.1:8b --task "Test registration and login screens without submitting real credentials."
```

Installed console aliases are also available:

```bash
metl-web-test-doctor
metl-web-test-smoke --url http://localhost:3000
metl-web-test-agent --url http://localhost:3000 --headed --task "Find broken user flows."
```

## Safety Rules

The default agent prompt tells the browser agent:

- stay on the target app unless a flow clearly opens a local/auth page,
- do not make purchases,
- do not delete data,
- do not submit destructive actions,
- do not invent credentials,
- report blocked login/auth flows instead of forcing them.

## GCP/Azure VM Notes

On a VM, run headless:

```env
BROWSER_HEADLESS=true
OLLAMA_BASE_URL=http://localhost:11434
```

Install system dependencies for Playwright:

```bash
python -m playwright install --with-deps chromium
```

For a separate Ollama host, expose Ollama carefully on a private network only and set:

```env
OLLAMA_BASE_URL=http://PRIVATE_OLLAMA_HOST:11434
```

## Playwright MCP Option

For agent tools that support MCP, run:

```bash
npx @playwright/mcp@latest --port 8931
```

Then point the MCP client to:

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

This project still works without MCP; MCP is just a later integration option.
