import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const AGENT_URL = process.env.AGENT_SERVICE_URL || "http://localhost:8000";

async function checkDockerStatus(): Promise<{
  running: boolean;
  containerCount: number;
}> {
  try {
    const { stdout } = await execFileAsync("docker", ["ps", "-q"], { timeout: 5000 });
    const count = stdout.trim() ? stdout.trim().split("\n").length : 0;
    return { running: count > 0, containerCount: count };
  } catch {
    return { running: false, containerCount: 0 };
  }
}

export async function GET() {
  const docker = await checkDockerStatus();
  const agentHealth = await fetch(`${AGENT_URL}/health/`, { signal: AbortSignal.timeout(3000) })
    .then((res) => res.json())
    .catch(() => null);

  return NextResponse.json({
    gemini: {
      provider: "gemini",
      mode: agentHealth?.gemini_provider || process.env.GEMINI_PROVIDER || "developer",
      configured: agentHealth?.gemini_configured ?? (
        !!process.env.GEMINI_API_KEY ||
        !!process.env.GOOGLE_APPLICATION_CREDENTIALS
      ),
      healthy: agentHealth?.gemini_healthy ?? false,
      model: agentHealth?.model || process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
    },
    ide: {
      provider: "openvscode",
      status: docker.running ? "running" : "not_started",
      containers: docker.containerCount,
    },
    workspace: {
      provider: "local-docker",
      status: docker.running ? "running" : "not_started",
      containers: docker.containerCount,
    },
    github: {
      configured: !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
    },
  });
}
