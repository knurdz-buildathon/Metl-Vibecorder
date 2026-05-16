# Metl-VibeCoder

**Metl-VibeCoder** is a Gemini-powered AI coding workspace.

A user describes what they want to build or change, and the system understands the project, generates or modifies code, runs checks, repairs problems, and explains what it did. It is an AI coding assistant + browser IDE + repo understanding + safe code generation + test/repair system + final engineering report.

## Modes

- **Ask** — understand only (no edits)
- **Plan** — plan first, then build after approval
- **Agent** — build automatically
- **Repair** — fix broken code after checks fail
- **Review** — review final code for risks and quality

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Monaco Editor |
| Backend API | Next.js API Routes, Prisma, PostgreSQL, Redis |
| AI Agent | Python 3.11, FastAPI, Google Gemini SDK |
| IDE | OpenVSCode Server (code-server) |
| Testing | Playwright |
| Deployment | Docker Compose, Nginx, GCP VM |

## Quick Start

```bash
# Copy environment template
cp .env.example .env
# Fill in your Gemini API key, GitHub OAuth credentials, etc.

# Start all services
docker compose up --build

# Or run locally (requires Node.js 20+, Python 3.11+, PostgreSQL, Redis)
cd apps/web && npm install && npx prisma migrate dev && npm run dev
cd apps/agent && pip install -r requirements.txt && uvicorn src.main:app --reload
```

## Project Structure

```
metl-vibecoder/
├── apps/
│   ├── web/          # Next.js frontend + API routes
│   ├── agent/        # Python FastAPI AI agent service
│   └── workspace-image/  # Docker image for user code workspaces
├── docker-compose.yml
├── nginx.conf
└── .env.example
```

## License

MIT
