#!/usr/bin/env node
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Agent } from "@cursor/sdk";
import { GoogleGenAI, type Content } from "@google/genai";

type Role = "user" | "model";
type Backend = "vertex-express" | "gemini-developer";
type Command = "chat" | "image";

type ChatTurn = {
  role: Role;
  text: string;
};

type CliOptions = {
  aspectRatio: string;
  backend: Backend;
  command: Command;
  cursorForce: boolean;
  cursorModel: string;
  doctor: boolean;
  help: boolean;
  imageModel: string;
  imageSize: string;
  imagePrompt: string;
  model: string;
  outputDir: string;
  projectDir: string;
  prompt: string;
};

type LaunchImageSpec = {
  summary: string;
  imagePrompt: string;
  altText: string;
  caption: string;
};

const DEFAULT_BACKEND: Backend = "vertex-express";
const DEFAULT_CHAT_MODEL = "gemini-2.5-flash";
const DEFAULT_CURSOR_MODEL = "composer-2";
const DEFAULT_IMAGE_MODEL = "imagen-4.0-generate-001";
const DEFAULT_SYSTEM_PROMPT =
  "You are a concise, helpful chatbot for testing a Google Cloud Gemini API key.";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (options.command === "image") {
    await runImageGenerator(options);
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
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GCP_CLOUD_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing API key. Set GOOGLE_API_KEY, GEMINI_API_KEY, or GCP_CLOUD_API_KEY in gcp/.env.",
    );
  }

  return apiKey;
}

function readCursorApiKey(): string {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    throw new Error("Missing CURSOR_API_KEY in gcp/.env. Image mode uses Cursor Agent SDK to summarize the project.");
  }
  return apiKey;
}

function createClient(apiKey: string, backend: Backend): GoogleGenAI {
  if (backend === "vertex-express") {
    return new GoogleGenAI({ vertexai: true, apiKey });
  }
  return new GoogleGenAI({ apiKey });
}

async function runImageGenerator(options: CliOptions) {
  const apiKey = readApiKey();
  const projectDir = path.resolve(options.projectDir);
  const outputDir = path.resolve(options.outputDir);
  const ai = createClient(apiKey, options.backend);

  if (options.backend !== "vertex-express") {
    console.warn("Image mode is intended for Vertex AI / Agent Platform keys. Use GENAI_BACKEND=vertex-express unless you know your image model supports another backend.");
  }

  console.log("Generating launch image package...");
  console.log(`Project: ${options.imagePrompt ? "manual prompt" : projectDir}`);
  console.log(`Cursor model: ${options.imagePrompt ? "skipped" : options.cursorModel}`);
  console.log(`Image backend: ${options.backend}`);
  console.log(`Image model: ${options.imageModel}`);
  console.log(`Output: ${outputDir}`);

  const spec = options.imagePrompt
    ? createManualLaunchImageSpec(options.imagePrompt)
    : await createLaunchImageSpecWithCursor({
        apiKey: readCursorApiKey(),
        projectDir,
        userBrief: options.prompt,
        model: options.cursorModel,
        force: options.cursorForce,
      });

  await mkdir(outputDir, { recursive: true });
  const slug = makeTimestampSlug();
  const image = await ai.models.generateImages({
    model: options.imageModel,
    prompt: spec.imagePrompt,
    config: {
      numberOfImages: 1,
      aspectRatio: options.aspectRatio,
      imageSize: options.imageSize,
      outputMimeType: "image/png",
      includeRaiReason: true,
      includeSafetyAttributes: true,
      addWatermark: true,
      enhancePrompt: true,
    },
  });

  const generated = image.generatedImages?.[0];
  const imageBytes = generated?.image?.imageBytes;
  if (!imageBytes) {
    throw new Error("Imagen did not return image bytes. The prompt may have been filtered or the model may not be enabled.");
  }

  const imagePath = path.join(outputDir, `launch-${slug}.png`);
  const promptPath = path.join(outputDir, `launch-${slug}.prompt.txt`);
  const summaryPath = path.join(outputDir, `launch-${slug}.summary.md`);
  const metadataPath = path.join(outputDir, `launch-${slug}.metadata.json`);

  await writeFile(imagePath, Buffer.from(imageBytes, "base64"));
  await writeFile(promptPath, spec.imagePrompt);
  await writeFile(summaryPath, renderSummary(spec));
  await writeFile(
    metadataPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        projectDir,
        backend: options.backend,
        cursorModel: options.cursorModel,
        imageModel: options.imageModel,
        aspectRatio: options.aspectRatio,
        imageSize: options.imageSize,
        outputMimeType: generated?.image?.mimeType || "image/png",
        altText: spec.altText,
        caption: spec.caption,
      },
      null,
      2,
    ),
  );

  console.log("");
  console.log(`Image: ${imagePath}`);
  console.log(`Prompt: ${promptPath}`);
  console.log(`Summary: ${summaryPath}`);
  console.log(`Metadata: ${metadataPath}`);
}

function createManualLaunchImageSpec(prompt: string): LaunchImageSpec {
  return {
    summary: "Manual image prompt provided by user.",
    imagePrompt: prompt,
    altText: "Generated launch image from a user-provided prompt.",
    caption: "Generated with MetlCode GCP image lab.",
  };
}

async function createLaunchImageSpecWithCursor(request: {
  apiKey: string;
  projectDir: string;
  userBrief: string;
  model: string;
  force: boolean;
}): Promise<LaunchImageSpec> {
  const agent = await Agent.create({
    apiKey: request.apiKey,
    name: "Metl launch image prompt generator",
    model: { id: request.model },
    local: { cwd: request.projectDir },
  });

  try {
    const run = await agent.send(buildCursorImagePrompt(request.userBrief), {
      model: { id: request.model },
      ...(request.force ? { local: { force: true } } : {}),
    });

    for await (const event of run.stream()) {
      renderCursorEvent(event);
    }

    const result = await run.wait();
    if (result.status !== "finished") {
      throw new Error(`Cursor agent finished with status ${result.status}`);
    }

    return parseLaunchImageSpec(result.result || "");
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

function buildCursorImagePrompt(userBrief: string): string {
  return [
    "You are creating a launch/social image prompt for a software project.",
    "Read the local project and summarize what it is. Do not edit files. Do not create files. Do not run mutating commands.",
    "Return only valid JSON with this exact shape:",
    '{"summary":"...","imagePrompt":"...","altText":"...","caption":"..."}',
    "",
    "Image prompt requirements:",
    "- Make a polished 16:9 launch-card or social-post cover image.",
    "- Do not request real logos unless they are present in the project.",
    "- Prefer UI/product visual language over generic abstract art.",
    "- Include space for a short title, but do not depend on tiny readable text.",
    "- Avoid mentioning protected brand names unless the project itself uses them.",
    "- Make it suitable for posting after the project is completed.",
    "",
    userBrief ? `Extra user brief: ${userBrief}` : "Extra user brief: none.",
  ].join("\n");
}

function parseLaunchImageSpec(text: string): LaunchImageSpec {
  const parsed = parseJsonObject(text);
  if (!parsed) {
    return {
      summary: "Cursor returned non-JSON output.",
      imagePrompt: text.trim(),
      altText: "Generated launch image for the project.",
      caption: "Built with MetlCode.",
    };
  }

  return {
    summary: readString(parsed.summary, "Project summary unavailable."),
    imagePrompt: readString(parsed.imagePrompt, "A polished launch-card image for a completed software project."),
    altText: readString(parsed.altText, "Generated launch image for the project."),
    caption: readString(parsed.caption, "Built with MetlCode."),
  };
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1]?.trim() || trimmed;
  try {
    const parsed = JSON.parse(jsonText);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        const parsed = JSON.parse(jsonText.slice(first, last + 1));
        return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function renderSummary(spec: LaunchImageSpec): string {
  return [
    "# Launch Image Summary",
    "",
    "## Project Summary",
    spec.summary,
    "",
    "## Caption",
    spec.caption,
    "",
    "## Alt Text",
    spec.altText,
    "",
    "## Image Prompt",
    spec.imagePrompt,
    "",
  ].join("\n");
}

function makeTimestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
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
  let aspectRatio = process.env.IMAGE_ASPECT_RATIO || "16:9";
  let backend = readBackend(process.env.GENAI_BACKEND);
  let command: Command = "chat";
  let cursorForce = false;
  let cursorModel = process.env.CURSOR_MODEL || DEFAULT_CURSOR_MODEL;
  let doctor = false;
  let help = false;
  let imageModel = process.env.IMAGEN_MODEL || DEFAULT_IMAGE_MODEL;
  let imagePrompt = process.env.IMAGE_PROMPT || "";
  let imageSize = process.env.IMAGE_SIZE || "1K";
  let model = process.env.GEMINI_MODEL || DEFAULT_CHAT_MODEL;
  let outputDir = process.env.IMAGE_OUTPUT_DIR || "outputs";
  let projectDir = process.cwd();

  const args = [...argv];
  if (args[0] === "image" || args[0] === "generate-image") {
    command = "image";
    args.shift();
  } else if (args[0] === "chat") {
    args.shift();
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg === "--doctor") {
      doctor = true;
      continue;
    }
    if (arg === "--force") {
      cursorForce = true;
      continue;
    }
    if (arg === "--backend" || arg === "-b") {
      backend = readBackend(readOptionValue(args, index, arg));
      index += 1;
      continue;
    }
    if (arg.startsWith("--backend=")) {
      backend = readBackend(arg.slice("--backend=".length));
      continue;
    }
    if (arg === "--model" || arg === "-m") {
      model = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length);
      continue;
    }
    if (arg === "--cursor-model") {
      cursorModel = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--cursor-model=")) {
      cursorModel = arg.slice("--cursor-model=".length);
      continue;
    }
    if (arg === "--image-model") {
      imageModel = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--prompt" || arg === "-p") {
      imagePrompt = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--prompt=")) {
      imagePrompt = arg.slice("--prompt=".length);
      continue;
    }
    if (arg.startsWith("--image-model=")) {
      imageModel = arg.slice("--image-model=".length);
      continue;
    }
    if (arg === "--project" || arg === "-C") {
      projectDir = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--project=")) {
      projectDir = arg.slice("--project=".length);
      continue;
    }
    if (arg === "--out" || arg === "-o") {
      outputDir = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--out=")) {
      outputDir = arg.slice("--out=".length);
      continue;
    }
    if (arg === "--aspect") {
      aspectRatio = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--aspect=")) {
      aspectRatio = arg.slice("--aspect=".length);
      continue;
    }
    if (arg === "--image-size") {
      imageSize = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--image-size=")) {
      imageSize = arg.slice("--image-size=".length);
      continue;
    }
    if (arg === "--") {
      promptParts.push(...args.slice(index + 1));
      break;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    promptParts.push(arg, ...args.slice(index + 1));
    break;
  }

  return {
    aspectRatio,
    backend,
    command,
    cursorForce,
    cursorModel,
    doctor,
    help,
    imageModel,
    imagePrompt,
    imageSize,
    model,
    outputDir,
    projectDir,
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

function renderCursorEvent(event: unknown) {
  if (!isRecord(event)) return;
  if (event.type === "status" && typeof event.status === "string" && event.status !== "FINISHED") {
    process.stderr.write(`[cursor] ${event.status}\n`);
  }
  if (event.type === "tool_call") {
    const name = typeof event.name === "string" ? event.name : "tool";
    const status = typeof event.status === "string" ? event.status : "running";
    process.stderr.write(`[cursor] ${status} ${name}\n`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function printHelp() {
  console.log(`GCP Gemini Chatbot and Launch Image Generator

Chat:
  npm run dev
  npm run dev -- "Your prompt"
  npm run dev -- --doctor
  npm run dev -- --backend vertex-express --model gemini-2.5-flash "Your prompt"
  npm run dev -- --backend gemini-developer "Your prompt"

Launch image:
  npm run dev -- image --prompt "A polished launch-card image for a modern AI coding workspace"
  npm run dev -- image --project .. --out outputs
  npm run dev -- image --project ../apps/web --aspect 16:9 "make it sleek and product-focused"

Environment:
  GOOGLE_API_KEY, GEMINI_API_KEY, or GCP_CLOUD_API_KEY
  CURSOR_API_KEY optional; only required for image mode when --prompt is not provided
  GENAI_BACKEND optional, defaults to ${DEFAULT_BACKEND}
  GEMINI_MODEL optional, defaults to ${DEFAULT_CHAT_MODEL}
  CURSOR_MODEL optional, defaults to ${DEFAULT_CURSOR_MODEL}
  IMAGEN_MODEL optional, defaults to ${DEFAULT_IMAGE_MODEL}
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
