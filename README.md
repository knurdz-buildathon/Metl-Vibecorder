# Metl-VibeCoder

## What This Is

Metl-VibeCoder is a **Gemini-powered AI coding workspace**.

- **Ask** — understand the repo without editing
- **Plan** — generate an implementation plan, wait for approval
- **Agent** — build automatically with checks and repair
- **Repair** — fix failed checks
- **Review** — get a final quality/risk summary

## Architecture

```
+------------+     REST/SSE     +------------+
|  Next.js   | <------------->  |  FastAPI   |
|   (Web)    |                  |  (Agent)   |
+------------+                  +------------+
      |                               |
   Prisma                          Gemini
  Postgres                        Vertex AI
   Redis                      / Developer API
```

## Quick Start

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env with your Gemini API key (developer mode) or Google Cloud credentials (vertex mode)

# 2. Start infrastructure
docker compose up -d postgres redis

# 3. Run database migrations
cd apps/web
npx prisma migrate dev

# 4. Start the web app (terminal 1)
npm run dev

# 5. Start the agent service (terminal 2)
cd apps/agent
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

# 6. Open http://localhost:3000
```

## Modes

| Mode | Description | Edits? | Checks? | Approval? |
|---|---|---|---|---|
| Ask | Answer questions about the repo | No | No | No |
| Plan | Analyze request, create plan | No | No | Plan approval |
| Agent | Build automatically | Yes | Yes | No |
| Repair | Fix failed checks | Yes | Re-run | No |
| Review | Risk/quality summary | No | No | No |

## Configuration

### Gemini Developer Mode (local)

```env
GEMINI_PROVIDER=developer
GEMINI_API_KEY=your_key_from_ai.google.dev
GEMINI_MODEL=gemini-3.1-pro-preview-customtools
```

### Gemini Vertex AI (production)

```env
GEMINI_PROVIDER=vertex
GOOGLE_CLOUD_PROJECT=your-gcp-project
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Safety

- `.env` files are protected from edits
- `.git` internals are protected
- Force git operations are blocked
- Max repair attempts: `VIBECODER_MAX_REPAIR_ATTEMPTS` (default 2)
- Internal docs stored outside user workspace

## Project Structure

```
metl-vibecoder/
├── apps/
│   ├── web/          # Next.js 15 + React 19 frontend + API routes
│   ├── agent/        # Python FastAPI agent service
│   └── workspace-image/  # Docker image for user workspaces
├── docker-compose.yml
├── nginx.conf
└── .env.example
```

## License

MIT
