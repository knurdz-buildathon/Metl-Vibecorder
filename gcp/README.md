# GCP Gemini Chatbot

A tiny terminal chatbot for testing a Google Cloud / Gemini API key and watching your free credit move.

It defaults to **Vertex AI Express mode**, which is the mode you want when your key is connected to Google Cloud / Agent Platform / Vertex AI rather than a plain AI Studio key.

## Setup

```bash
cd gcp
npm install
cp .env.example .env
```

Paste your key into one of:

- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`
- `GCP_CLOUD_API_KEY`

Keep this default for an Agent Platform / Vertex key:

```env
GENAI_BACKEND=vertex-express
GEMINI_MODEL=gemini-2.5-flash
```

If you are using a normal AI Studio Gemini key instead:

```env
GENAI_BACKEND=gemini-developer
```

## Run

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

## Commands

Inside interactive chat:

- `/help` shows commands
- `/clear` resets chat history
- `/model gemini-2.5-flash` changes the model
- `/exit` quits

## Notes

This app uses Google's maintained `@google/genai` SDK with the Gemini `generateContent` API. For Vertex AI Express mode, the client is initialized with `vertexai: true`, which is required for Google Cloud / Agent Platform style API keys. It keeps conversation history in memory only and does not write chats to disk.
