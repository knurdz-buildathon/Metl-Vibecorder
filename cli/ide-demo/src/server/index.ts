import fs from "node:fs/promises";
import path from "node:path";
import { Agent } from "@cursor/sdk";
import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import type { FileContentResponse, FileNode, FileTreeResponse, StreamEvent } from "../shared/types.js";

const appRoot = process.cwd();
const generatedRoot = path.join(appRoot, "generated-projects", "current");
const isProduction = process.env.NODE_ENV === "production";

for (const envPath of [
  path.join(appRoot, ".env"),
  path.join(appRoot, "..", ".env"),
  path.join(appRoot, "..", "..", ".env")
]) {
  dotenv.config({ path: envPath, quiet: true });
}

await ensureGeneratedRoot();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/workspace", (_request, response) => {
  response.json({
    root: generatedRoot,
    model: process.env.CURSOR_MODEL ?? "composer-2"
  });
});

app.get("/api/files", async (_request, response, next) => {
  try {
    response.json({
      root: generatedRoot,
      tree: await listTree(generatedRoot)
    } satisfies FileTreeResponse);
  } catch (error) {
    next(error);
  }
});

app.get("/api/file", async (request, response, next) => {
  try {
    const relativePath = typeof request.query.path === "string" ? request.query.path : "";
    const absolutePath = resolveInsideGeneratedRoot(relativePath);
    const stat = await fs.stat(absolutePath);

    if (!stat.isFile()) {
      response.status(400).json({ error: "Path is not a file." });
      return;
    }

    if (stat.size > 1_000_000) {
      response.status(413).json({ error: "File is too large to preview." });
      return;
    }

    response.json({
      path: relativePath,
      content: await fs.readFile(absolutePath, "utf8"),
      size: stat.size
    } satisfies FileContentResponse);
  } catch (error) {
    next(error);
  }
});

app.post("/api/reset", async (_request, response, next) => {
  try {
    await fs.rm(generatedRoot, { recursive: true, force: true });
    await ensureGeneratedRoot();
    response.json({ ok: true, tree: await listTree(generatedRoot) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/generate", async (request, response) => {
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");

  const send = (event: StreamEvent) => {
    response.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const prompt = String(request.body?.prompt ?? "").trim();
    const model = String(request.body?.model ?? process.env.CURSOR_MODEL ?? "composer-2").trim();

    if (!prompt) {
      send({ type: "error", message: "Prompt is required." });
      response.end();
      return;
    }

    const apiKey = process.env.CURSOR_API_KEY;
    if (!apiKey) {
      send({ type: "error", message: "CURSOR_API_KEY is missing. Add it to cli/ide-demo/.env or cli/.env." });
      response.end();
      return;
    }

    await ensureGeneratedRoot();
    const startedAt = Date.now();
    send({ type: "status", message: `Starting Cursor SDK agent with ${model}` });

    const agent = await Agent.create({
      apiKey,
      name: "Metl IDE demo",
      model: { id: model },
      local: { cwd: generatedRoot }
    });

    try {
      const run = await agent.send(buildGenerationPrompt(prompt), {
        model: { id: model },
        local: { force: true }
      });

      for await (const event of run.stream()) {
        emitSdkEvent(event, send);
      }

      const result = await run.wait();
      send({ type: "files", tree: await listTree(generatedRoot) });
      send({
        type: "done",
        status: result.status,
        durationMs: Date.now() - startedAt
      });
    } finally {
      await agent[Symbol.asyncDispose]();
    }
  } catch (error) {
    send({ type: "error", message: error instanceof Error ? error.message : String(error) });
  } finally {
    response.end();
  }
});

if (isProduction) {
  const clientDist = path.join(appRoot, "dist", "client");
  app.use(express.static(clientDist));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  const vite = await createViteServer({
    root: appRoot,
    appType: "spa",
    server: {
      middlewareMode: true,
      watch: {
        ignored: ["**/generated-projects/**"]
      }
    }
  });
  app.use(vite.middlewares);
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  response.status(500).json({ error: error instanceof Error ? error.message : String(error) });
});

const port = Number(process.env.PORT ?? 4177);
app.listen(port, "127.0.0.1", () => {
  const mode = isProduction ? "production" : "development";
  console.log(`Metl IDE demo running at http://127.0.0.1:${port} (${mode})`);
  console.log(`Generated workspace: ${generatedRoot}`);
});

function buildGenerationPrompt(userPrompt: string) {
  return [
    "You are the code-generation engine behind a local vibe-coding IDE demo.",
    `The isolated project workspace is ${generatedRoot}.`,
    "Create or modify project files only inside this workspace.",
    "Build a complete runnable sample for the user's request, including package.json when useful.",
    "Prefer fast frontend stacks such as Vite, React, TypeScript, and plain CSS unless the request asks otherwise.",
    "After writing files, run the smallest practical install/build/check command for the generated project.",
    "If a dependency install is needed, use npm. Keep generated output self-contained.",
    "Finish with changed files, build/test commands run, and any blocker.",
    "",
    "User prompt:",
    userPrompt
  ].join("\n");
}

function emitSdkEvent(event: unknown, send: (event: StreamEvent) => void) {
  if (!isRecord(event)) {
    return;
  }

  if (event.type === "assistant" && isRecord(event.message)) {
    const content = event.message.content;
    if (!Array.isArray(content)) {
      return;
    }

    for (const block of content) {
      if (isRecord(block) && block.type === "text" && typeof block.text === "string") {
        send({ type: "assistant", text: block.text });
      } else if (isRecord(block) && typeof block.name === "string") {
        send({ type: "tool", name: block.name, status: "requested" });
      }
    }
    return;
  }

  if (event.type === "thinking" && typeof event.text === "string") {
    send({ type: "thinking", text: compact(event.text) });
    return;
  }

  if (event.type === "tool_call") {
    send({
      type: "tool",
      name: typeof event.name === "string" ? event.name : "tool",
      status: typeof event.status === "string" ? event.status : "running"
    });
    return;
  }

  if (event.type === "status") {
    const status = typeof event.status === "string" ? event.status : "status";
    const message = typeof event.message === "string" ? ` ${compact(event.message)}` : "";
    send({ type: "status", message: `${status}${message}`.trim() });
  }
}

async function ensureGeneratedRoot() {
  await fs.mkdir(generatedRoot, { recursive: true });
}

async function listTree(root: string): Promise<FileNode[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) {
      continue;
    }

    const absolutePath = path.join(root, entry.name);
    const relativePath = path.relative(generatedRoot, absolutePath).split(path.sep).join("/");

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: "directory",
        children: await listTree(absolutePath)
      });
    } else if (entry.isFile()) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: "file"
      });
    }
  }

  return nodes.sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "directory" ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
}

function resolveInsideGeneratedRoot(relativePath: string) {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = path.resolve(generatedRoot, normalized);
  const relative = path.relative(generatedRoot, absolutePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path escapes generated workspace.");
  }

  return absolutePath;
}

function shouldIgnore(name: string) {
  return [
    ".git",
    ".DS_Store",
    "node_modules",
    ".next",
    ".vite",
    "coverage"
  ].includes(name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function compact(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
