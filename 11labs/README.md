# Metl Speech Lab

Standalone local demo for testing ElevenLabs realtime Speech-to-Text before wiring voice prompts into MetlCode.

## What It Does

- Streams microphone audio to ElevenLabs Scribe v2 Realtime.
- Shows quick interim text while you speak.
- Writes only committed, more stable transcript segments into the final transcript box.
- Uses a slightly slower VAD commit window to favor accuracy over instant finalization.

## ElevenLabs Key Setup

1. Log in to [ElevenLabs](https://elevenlabs.io/).
2. Open **Developers** in the left sidebar.
3. Select **API Keys**.
4. Create a new key named `metl-speech-lab`.
5. Keep the key restricted and enable **Realtime Speech-to-Text** plus **Single Use Tokens**.
6. Set a small credit limit while testing.
7. Copy the key when it is created. ElevenLabs only shows the full key once.
8. Create `11labs/.env`:

```bash
cp .env.example .env
```

Then set:

```bash
ELEVENLABS_API_KEY=your_real_key_here
```

Optionally set `ELEVENLABS_LANGUAGE_CODE=en` if you want to force English instead of automatic language detection.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:4111](http://localhost:4111).

## Scripts

```bash
npm run typecheck
npm run build
npm start
```

## Notes For Future Metl Integration

- Keep the ElevenLabs key on the backend only.
- Use `/api/scribe-token` to mint short-lived realtime tokens for the browser.
- Feed the final transcript into Metl Ask/Plan/Agent flows later.
- Keep low credit limits while testing live microphone audio.
