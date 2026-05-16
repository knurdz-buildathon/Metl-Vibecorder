# Metl IDE Demo

Standalone browser demo for vibe-coding with the Cursor Agent SDK.

It runs separately from the main app and writes generated projects to:

```bash
cli/ide-demo/generated-projects/current
```

## Setup

```bash
cd cli/ide-demo
npm install
cp .env.example .env
```

Add your Cursor API key:

```env
CURSOR_API_KEY=crsr_...
CURSOR_MODEL=composer-2
```

You can also keep the key in `cli/.env`; this demo loads both.

## Run

```bash
npm run dev
```

Open:

```bash
http://127.0.0.1:4177
```

Type a prompt, click **Build Project**, and the Cursor SDK agent will generate files inside `generated-projects/current`. The UI refreshes the file tree and lets you preview generated files.

## Build

```bash
npm run build
npm start
```

## Safety

- The demo agent workspace is isolated to `generated-projects/current`.
- The original `/cli` command remains unchanged.
- `node_modules`, `dist`, and generated output are ignored by git.
