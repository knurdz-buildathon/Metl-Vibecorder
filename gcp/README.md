# GCP Gemini Chatbot and Launch Image Generator

A small GCP lab for MetlCode. It can:

- test a Google Cloud / Agent Platform / Vertex AI API key
- run a terminal Gemini chatbot
- ask Cursor Agent SDK to summarize a project and produce a launch-image prompt
- generate a post-ready image with Vertex Imagen

It defaults to **Vertex AI Express mode**, which is the mode you want when your key is connected to Google Cloud / Agent Platform / Vertex AI rather than a plain AI Studio key.

## Setup

```bash
cd gcp
npm install
cp .env.example .env
```

Paste your Google key into one of:

- `GOOGLE_API_KEY`
- `GEMINI_API_KEY`
- `GCP_CLOUD_API_KEY`

For project-summary image mode, also add:

```env
CURSOR_API_KEY=your_cursor_key
```

If you provide the image prompt yourself with `--prompt`, `CURSOR_API_KEY` is not needed.

Keep this default for an Agent Platform / Vertex key:

```env
GENAI_BACKEND=vertex-express
GEMINI_MODEL=gemini-2.5-flash
```

If you are using a normal AI Studio Gemini key instead:

```env
GENAI_BACKEND=gemini-developer
```

## Chat

Interactive chat:

```bash
npm run dev
```

Check whether the key works:

```bash
npm run dev -- --doctor
```

One-shot prompt:

```bash
npm run dev -- "Say hello in one sentence"
```

Force Vertex Express mode:

```bash
npm run dev -- --backend vertex-express "Say hello"
```

After building:

```bash
npm run build
npm start -- "What model are you?"
```

## Generate A Project Launch Image

This is the Metl-VibeCoder use case: Cursor reads and summarizes a finished project, creates a polished image prompt, and Imagen generates the post image.

Direct prompt to image, no Cursor API required:

```bash
npm run dev -- image --prompt "A polished 16:9 launch-card image for an AI coding workspace named MetlCode, dark interface, glowing code editor, clean product marketing style"
```

Direct prompt from `.env`:

```env
IMAGE_PROMPT=A polished 16:9 launch-card image for an AI coding workspace named MetlCode
```

```bash
npm run dev -- image
```

Project-summary mode, requires `CURSOR_API_KEY`:

```bash
npm run dev -- image --project .. --out outputs
```

For a specific app:

```bash
npm run dev -- image --project ../apps/web --aspect 16:9 "make it sleek and product-focused"
```

Outputs:

```txt
outputs/
  launch-<timestamp>.png
  launch-<timestamp>.prompt.txt
  launch-<timestamp>.summary.md
  launch-<timestamp>.metadata.json
```

Useful options:

```bash
--project <dir>          project Cursor should summarize
--out <dir>              output directory
--cursor-model <id>      Cursor model, defaults to composer-2
--image-model <id>       Imagen model, defaults to imagen-4.0-generate-001
--prompt <text>          direct image prompt, skips Cursor Agent SDK
--aspect <ratio>         16:9, 1:1, 9:16, 4:3, 3:4
--image-size <size>      1K or 2K
--force                  expire a stuck local Cursor run
```

## Interactive Commands

Inside chat:

- `/help` shows commands
- `/clear` resets chat history
- `/model gemini-2.5-flash` changes the model
- `/exit` quits

## Notes

This app uses Google's maintained `@google/genai` SDK with the Gemini `generateContent` and Imagen `generateImages` APIs. For Vertex AI Express mode, the client is initialized with `vertexai: true`, which is required for Google Cloud / Agent Platform style API keys.

The launch image workflow keeps generated files under `outputs/`, which is ignored by git.
