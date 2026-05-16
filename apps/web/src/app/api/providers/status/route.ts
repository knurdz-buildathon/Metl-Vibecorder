import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function checkDockerStatus(): Promise<{
  running: boolean;
  containerCount: number;
}> {
  try {
    const { stdout } = await execAsync("docker ps -q | wc -l", { timeout: 5000 });
    const count = parseInt(stdout.trim(), 10) || 0;
    return { running: count > 0, containerCount: count };
  } catch {
    return { running: false, containerCount: 0 };
  }
}

export async function GET() {
  const docker = await checkDockerStatus();

  return NextResponse.json({
    gemini: {
      provider: "gemini",
      mode: process.env.GEMINI_PROVIDER || "developer",
      configured:
        !!process.env.GEMINI_API_KEY ||
        !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      model: process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
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
