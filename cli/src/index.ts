#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Agent } from "@cursor/sdk";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Prefer cwd (e.g. monorepo root) then fall back to this package's .env when using -C elsewhere.
dotenv.config();
dotenv.config({ path: path.join(packageRoot, ".env") });

type CliOptions = {
  cwd: string;
  force: boolean;
  help: boolean;
  model: string;
  prompt: string;
  name: string;
};

const DEFAULT_MODEL = process.env.CURSOR_MODEL ?? "composer-2";

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    throw new Error("Set CURSOR_API_KEY before running the CLI.");
  }

  if (!fs.existsSync(options.cwd) || !fs.statSync(options.cwd).isDirectory()) {
    throw new Error(`Workspace directory does not exist: ${options.cwd}`);
  }

  const prompt = options.prompt || (await readPromptFromStdin());
  if (!prompt.trim()) {
    throw new Error("Pass a prompt argument or pipe one into stdin.");
  }

  await runCodegen(apiKey, options, prompt.trim());
}

function parseArgs(argv: string[]): CliOptions {
  const promptParts: string[] = [];
  let cwd = process.cwd();
  let force = false;
  let help = false;
  let model = DEFAULT_MODEL;
  let name = "Metl codegen CLI";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      promptParts.push(...argv.slice(index + 1));
      break;
    }

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--cwd" || arg === "-C") {
      cwd = readOptionValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--cwd=")) {
      cwd = arg.slice("--cwd=".length);
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

    if (arg === "--name") {
      name = readOptionValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--name=")) {
      name = arg.slice("--name=".length);
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    promptParts.push(arg, ...argv.slice(index + 1));
    break;
  }

  return {
    cwd: path.resolve(cwd),
    force,
    help,
    model,
    name,
    prompt: promptParts.join(" ").trim(),
  };
}

function readOptionValue(argv: string[], index: number, option: string) {
  const value = argv[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`Expected a value after ${option}.`);
  }
  return value;
}

async function runCodegen(apiKey: string, options: CliOptions, userPrompt: string) {
  const agent = await Agent.create({
    apiKey,
    name: options.name,
    model: { id: options.model },
    local: { cwd: options.cwd },
  });

  const startedAt = Date.now();
  process.stderr.write(
    `[metl-codegen] local=${options.cwd} model=${options.model}\n`
  );

  try {
    const run = await agent.send(buildCodegenPrompt(userPrompt), {
      model: { id: options.model },
      ...(options.force ? { local: { force: true } } : {}),
    });

    for await (const event of run.stream()) {
      renderEvent(event);
    }

    const result = await run.wait();
    const duration = formatDuration(Date.now() - startedAt);
    process.stderr.write(
      `\n[metl-codegen] finished status=${result.status} duration=${duration}\n`
    );
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

function buildCodegenPrompt(userPrompt: string) {
  return [
    "You are a fast local code-generation agent launched from the Metl CLI.",
    "Work only inside the configured workspace unless the user explicitly asks otherwise.",
    "Inspect relevant files before editing and preserve unrelated user changes.",
    "Generate or modify code directly when needed, then run focused validation when practical.",
    "Keep terminal updates concise and finish with changed files, tests run, and any blockers.",
    "",
    "Code generation request:",
    userPrompt,
  ].join("\n");
}

function renderEvent(event: unknown) {
  if (!isRecord(event)) {
    return;
  }

  if (event.type === "assistant" && isRecord(event.message)) {
    const content = event.message.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (isRecord(block) && block.type === "text" && typeof block.text === "string") {
          process.stdout.write(block.text);
        }
      }
    }
    return;
  }

  if (event.type === "thinking" && typeof event.text === "string") {
    const text = compact(event.text);
    if (text) {
      process.stderr.write(`\n[thinking] ${text}\n`);
    }
    return;
  }

  if (event.type === "tool_call") {
    const name = typeof event.name === "string" ? event.name : "tool";
    const status = typeof event.status === "string" ? event.status : "running";
    process.stderr.write(`\n[tool] ${status} ${name}\n`);
    return;
  }

  if (event.type === "status") {
    const status = typeof event.status === "string" ? event.status : "status";
    const message = typeof event.message === "string" ? ` ${compact(event.message)}` : "";
    if (status !== "FINISHED") {
      process.stderr.write(`\n[status] ${status}${message}\n`);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function compact(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function readPromptFromStdin() {
  if (process.stdin.isTTY) {
    return "";
  }

  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input;
}

function formatDuration(ms: number) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

function printHelp() {
  console.log(`Metl code generation CLI

Usage:
  metl-codegen [options] "Generate or modify code..."
  echo "Generate or modify code..." | metl-codegen [options]

Options:
  -C, --cwd <dir>      Workspace directory for the local Cursor agent.
                       Defaults to the current directory.
  -m, --model <id>     Cursor model id. Defaults to CURSOR_MODEL or composer-2.
      --name <name>    Cursor agent session name.
      --force          Expire a stuck active local run before starting.
  -h, --help           Show this help.

Environment:
  CURSOR_API_KEY       Required Cursor API key.
  CURSOR_MODEL         Optional default model id.

Examples:
  metl-codegen "Create a Next.js login page with tests"
  metl-codegen -C ../some-app "Add input validation to the signup API"
  printf "Review and fix TypeScript errors" | metl-codegen --force
`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
