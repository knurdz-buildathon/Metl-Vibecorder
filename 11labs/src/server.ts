import "dotenv/config";
import express, { type Response as ExpressResponse } from "express";
import path from "node:path";

const app = express();

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const PORT = Number.parseInt(process.env.PORT ?? "4111", 10);
const DEFAULT_REALTIME_STT_MODEL = process.env.ELEVENLABS_REALTIME_STT_MODEL ?? "scribe_v2_realtime";
const LANGUAGE_CODE = process.env.ELEVENLABS_LANGUAGE_CODE?.trim() ?? "";

type ApiErrorBody = {
  error: string;
  detail?: unknown;
};

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(process.cwd(), "src", "public")));

app.get("/favicon.ico", (_req, res: ExpressResponse) => {
  res.status(204).end();
});

app.get("/api/health", (_req, res: ExpressResponse) => {
  res.json({
    ok: true,
    configured: hasUsableElevenLabsKey(),
    realtimeSttModel: DEFAULT_REALTIME_STT_MODEL,
    languageCode: LANGUAGE_CODE || null
  });
});

app.get("/api/scribe-token", async (_req, res: ExpressResponse) => {
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/single-use-token/realtime_scribe`, {
      method: "POST",
      headers: {
        "xi-api-key": requireElevenLabsKey()
      }
    });

    if (!response.ok) {
      throw await elevenLabsError(response, "Realtime speech-to-text token failed.");
    }

    const data = (await response.json()) as { token?: string };

    if (!data.token) {
      throw new HttpError(502, "ElevenLabs did not return a realtime token.");
    }

    res.json({
      token: data.token,
      modelId: DEFAULT_REALTIME_STT_MODEL,
      languageCode: LANGUAGE_CODE || null
    });
  } catch (error) {
    sendApiError(res, error);
  }
});

app.use((_req, res: ExpressResponse) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`ElevenLabs speech-to-text demo running at http://localhost:${PORT}`);
});

function requireElevenLabsKey() {
  const key = process.env.ELEVENLABS_API_KEY?.trim();

  if (!key) {
    throw new HttpError(500, "Set ELEVENLABS_API_KEY in 11labs/.env first.");
  }

  if (key === "your_elevenlabs_api_key_here" || key.startsWith("your_")) {
    throw new HttpError(500, "Replace ELEVENLABS_API_KEY in 11labs/.env with your real ElevenLabs key.");
  }

  return key;
}

function hasUsableElevenLabsKey() {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  return Boolean(key && key !== "your_elevenlabs_api_key_here" && !key.startsWith("your_"));
}

async function elevenLabsError(response: globalThis.Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";
  const detail = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => "");
  const message =
    response.status === 401
      ? `${fallback} ElevenLabs returned 401 Unauthorized. Check that the key allows Realtime Speech-to-Text and Single Use Tokens.`
      : fallback;

  return new HttpError(response.status, message, detail);
}

function sendApiError(res: ExpressResponse, error: unknown) {
  if (error instanceof HttpError) {
    const body: ApiErrorBody = { error: error.message };

    if (error.detail) {
      body.detail = error.detail;
    }

    res.status(error.status).json(body);
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Unexpected server error." });
}

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown
  ) {
    super(message);
  }
}
