#!/usr/bin/env node
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { GoogleGenAI, type Content } from "@google/genai";

type Role = "user" | "model";

type ChatTurn = {
  role: Role;
  text: string;
};

type CliOptions = {
  backend: Backend;
  doctor: boolean;
  help: boolean;
  model: string;
  prompt: string;
};

type Backend = "vertex-express" | "gemini-developer";

const DEFAULT_BACKEND: Backend = "vertex-express";
const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_SYSTEM_PROMPT =
  "You are a concise, helpful chatbot for testing a Google Cloud Gemini API key.";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const apiKey = readApiKey();
  const botName = process.env.BOT_NAME || "Metl GCP Bot";
  const systemPrompt = process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;
  const ai = createClient(apiKey, options.backend);

  if (options.doctor) {
    await runDoctor(ai, options);
    return;
  }

  if (options.prompt) {
    const answer = await sendMessage(ai, {
      model: options.model,
      backend: options.backend,
      systemPrompt,
      history: [],
      prompt: options.prompt,
    });
    console.log(answer);
    return;
  }

  await runInteractiveChat(ai, {
    botName,
    backend: options.backend,
    initialModel: options.model,
    systemPrompt,
  });
}

function readApiKey(): string {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GCP_CLOUD_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing API key. Set GEMINI_API_KEY, GOOGLE_API_KEY, or GCP_CLOUD_API_KEY in gcp/.env.",
    );
  }

  return apiKey;
}

function createClient(apiKey: string, backend: Backend): GoogleGenAI {
  if (backend === "vertex-express") {
    return new GoogleGenAI({ vertexai: true, apiKey });
  }
  return new GoogleGenAI({ apiKey });
}

async function runDoctor(ai: GoogleGenAI, options: CliOptions) {
  console.log("Checking API key with a tiny Gemini request...");
  console.log(`Backend: ${options.backend}`);
  console.log(`Model: ${options.model}`);
  const answer = await sendMessage(ai, {
    model: options.model,
    backend: options.backend,
    systemPrompt: "Reply with exactly: ok",
    history: [],
    prompt: "health check",
  });
  console.log(`Response: ${answer}`);
  console.log("API key works for this backend/model.");
}

async function runInteractiveChat(
  ai: GoogleGenAI,
  config: { botName: string; backend: Backend; initialModel: string; systemPrompt: string },
) {
  const rl = createInterface({ input, output });
  const history: ChatTurn[] = [];
  let model = config.initialModel;

  console.log(`${config.botName}`);
  console.log(`Backend: ${config.backend}`);
  console.log(`Model: ${model}`);
  console.log("Type /help for commands, /exit to quit.\n");

  try {
    while (true) {
      const prompt = (await rl.question("you> ")).trim();
      if (!prompt) continue;

      if (prompt === "/exit" || prompt === "/quit") break;
      if (prompt === "/help") {
        printChatHelp();
        continue;
      }
      if (prompt === "/clear") {
        history.length = 0;
        console.log("Chat history cleared.\n");
        continue;
      }
      if (prompt.startsWith("/model ")) {
        const nextModel = prompt.slice("/model ".length).trim();
        if (!nextModel) {
          console.log(`Current model: ${model}\n`);
        } else {
          model = nextModel;
          console.log(`Model changed to: ${model}\n`);
        }
        continue;
      }

      try {
        const answer = await sendMessage(ai, {
          model,
          backend: config.backend,
          systemPrompt: config.systemPrompt,
          history,
          prompt,
        });
        history.push({ role: "user", text: prompt });
        history.push({ role: "model", text: answer });
        console.log(`bot> ${answer}\n`);
      } catch (error) {
        console.error(`error> ${formatError(error)}\n`);
      }
    }
  } finally {
    rl.close();
  }
}

async function sendMessage(
  ai: GoogleGenAI,
  request: {
    model: string;
    backend: Backend;
    systemPrompt: string;
    history: ChatTurn[];
    prompt: string;
  },
): Promise<string> {
  const contents: Content[] = [
    ...request.history.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    {
      role: "user",
      parts: [{ text: request.prompt }],
    },
  ];

  const response = await ai.models.generateContent({
    model: request.model,
    contents,
    config: {
      systemInstruction: request.systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  return response.text?.trim() || "(No text response returned.)";
}

function parseArgs(argv: string[]): CliOptions {
  const promptParts: string[] = [];
  let backend = readBackend(process.env.GENAI_BACKEND);
  let doctor = false;
  let help = false;
  let model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg === "--doctor") {
      doctor = true;
      continue;
    }
    if (arg === "--backend" || arg === "-b") {
      backend = readBackend(readOptionValue(argv, index, arg));
      index += 1;
      continue;
    }
    if (arg.startsWith("--backend=")) {
      backend = readBackend(arg.slice("--backend=".length));
      continue;
    }
    if (arg === "--model" || arg === "-m") {
      model = readOptionValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length);
      continue;
    }
    if (arg === "--") {
      promptParts.push(...argv.slice(index + 1));
      break;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    promptParts.push(arg, ...argv.slice(index + 1));
    break;
  }

  return {
    backend,
    doctor,
    help,
    model,
    prompt: promptParts.join(" ").trim(),
  };
}

function readBackend(value: string | undefined): Backend {
  if (!value) return DEFAULT_BACKEND;
  if (value === "vertex-express" || value === "vertex") return "vertex-express";
  if (value === "gemini-developer" || value === "developer" || value === "gemini") {
    return "gemini-developer";
  }
  throw new Error(
    `Unknown backend "${value}". Use "vertex-express" or "gemini-developer".`,
  );
}

function readOptionValue(argv: string[], index: number, option: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
}

function printHelp() {
  console.log(`GCP Gemini Chatbot

Usage:
  npm run dev
  npm run dev -- "Your prompt"
  npm run dev -- --doctor
  npm run dev -- --backend vertex-express --model gemini-2.5-flash "Your prompt"
  npm run dev -- --backend gemini-developer "Your prompt"

Environment:
  GEMINI_API_KEY, GOOGLE_API_KEY, or GCP_CLOUD_API_KEY
  GENAI_BACKEND optional, defaults to ${DEFAULT_BACKEND}
  GEMINI_MODEL optional, defaults to ${DEFAULT_MODEL}
`);
}

function printChatHelp() {
  console.log(`Commands:
  /help                 Show this help
  /clear                Clear in-memory chat history
  /model <model-id>     Switch model for later turns
  /exit                 Quit
`);
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

main().catch((error) => {
  console.error(`Fatal: ${formatError(error)}`);
  process.exit(1);
});
