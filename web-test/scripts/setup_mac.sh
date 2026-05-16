#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required for this helper. Install it from https://brew.sh or install Ollama from https://ollama.com."
  exit 1
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "Installing Ollama with Homebrew..."
  brew install ollama
fi

if ! curl -fsS "${OLLAMA_BASE_URL:-http://localhost:11434}/api/tags" >/dev/null 2>&1; then
  if brew services list 2>/dev/null | grep -q '^ollama'; then
    echo "Starting Ollama with Homebrew services..."
    brew services start ollama
  else
    echo "Starting Ollama in the background..."
    nohup ollama serve >/tmp/metl-web-test-ollama.log 2>&1 &
  fi

  for _ in {1..20}; do
    if curl -fsS "${OLLAMA_BASE_URL:-http://localhost:11434}/api/tags" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

MODEL="${OLLAMA_MODEL:-qwen2.5:7b-instruct}"
echo "Pulling Ollama model: ${MODEL}"
ollama pull "${MODEL}"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
python -m playwright install chromium

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

python -m web_test.doctor

echo
echo "Ready. Run:"
echo "  source .venv/bin/activate"
echo "  python -m web_test.agent --url http://localhost:3000 --headed --task \"Explore the app and find broken flows\""
