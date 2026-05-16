# Metl Codegen CLI

Standalone local code-generation CLI powered by the Cursor Agent SDK.

This intentionally lives in `/cli` so it can be installed and tested without the web app, FastAPI agent, Docker services, or cloud IDE path.

## Setup

```bash
cd cli
npm install
cp .env.example .env
```

Set `CURSOR_API_KEY` in your shell:

```bash
export CURSOR_API_KEY="crsr_..."
```

Or put it in `/cli/.env`; the CLI loads that automatically when you run commands from `/cli`.

Optionally set a default model:

```bash
export CURSOR_MODEL="composer-2"
```

## Run

Ask it to generate or edit code in the current directory:

```bash
npm run dev -- "Create a small Express health-check endpoint"
```

From `/cli`, target this repository root with `-C ..`:

```bash
npm run dev -- -C .. "Explain the repo and make one small safe improvement"
```

Point it at another workspace:

```bash
npm run dev -- -C ../apps/web "Add a loading state to the sessions page"
```

Pipe a prompt from stdin:

```bash
printf "Find and fix TypeScript errors" | npm run dev --
```

## Build

```bash
npm run build
npm start -- "Explain this project and suggest one small cleanup"
```

After building, the executable is available at `dist/index.js`. You can link it locally if you want a direct command:

```bash
npm link
metl-codegen --help
```

## Notes

- Uses Cursor SDK local runtime by default: the agent works against the `--cwd` directory.
- Requires Node.js 22 or newer.
- Requires a Cursor API key in `CURSOR_API_KEY`.
- `--force` is available for clearing a stuck local run before starting a new one.
