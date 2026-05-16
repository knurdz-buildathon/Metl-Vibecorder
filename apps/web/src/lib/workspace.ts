import { execFile } from "child_process";
import { mkdir, rm } from "fs/promises";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const WORKSPACE_BASE_DIR = path.resolve(process.env.WORKSPACE_BASE_DIR || "./workspace-volumes");
const WORKSPACE_IMAGE = process.env.WORKSPACE_IMAGE || "codercom/code-server:latest";

export interface WorkspaceInfo {
  containerId: string;
  url: string;
  rootPath: string;
  repoPath: string;
  internalPath: string;
  previewUrl?: string;
  status: string;
}

export async function createWorkspace(sessionId: string): Promise<WorkspaceInfo> {
  const containerName = `vibecoder-${sessionId.slice(0, 8)}`;
  const workspaceDir = path.join(WORKSPACE_BASE_DIR, sessionId);
  const repoPath = path.join(workspaceDir, "repo");
  const internalPath = path.join(workspaceDir, "metl-internal");

  try {
    await mkdir(repoPath, { recursive: true });
    await mkdir(internalPath, { recursive: true });

    await execFileAsync("docker", ["rm", "-f", containerName]).catch(() => undefined);

    const { stdout } = await execFileAsync("docker", [
      "run",
      "-d",
      "--name",
      containerName,
      "-p",
      "0:8080",
      "-v",
      `${workspaceDir}:/workspace`,
      "-e",
      `PASSWORD=${process.env.CODE_SERVER_PASSWORD || "metlcode"}`,
      WORKSPACE_IMAGE,
    ]);

    const containerId = stdout.trim();

    const { stdout: portOutput } = await execFileAsync("docker", ["port", containerId, "8080"]);
    const port = portOutput.trim().split(":")[1] || "8080";

    return {
      containerId,
      url: `http://localhost:${port}`,
      rootPath: workspaceDir,
      repoPath,
      internalPath,
      status: "running",
    };
  } catch (error: any) {
    console.error("Workspace creation failed:", error.message);
    return {
      containerId: "",
      url: "",
      rootPath: workspaceDir,
      repoPath,
      internalPath,
      status: "failed",
    };
  }
}

export async function deleteWorkspace(sessionId: string): Promise<boolean> {
  const containerName = `vibecoder-${sessionId.slice(0, 8)}`;
  try {
    await execFileAsync("docker", ["rm", "-f", containerName]).catch(() => undefined);

    const workspaceDir = path.join(WORKSPACE_BASE_DIR, sessionId);
    await rm(workspaceDir, { recursive: true, force: true });

    return true;
  } catch (error: any) {
    console.error("Workspace cleanup failed:", error.message);
    return false;
  }
}

export async function stopWorkspace(containerId: string): Promise<boolean> {
  try {
    await execFileAsync("docker", ["stop", containerId]).catch(() => undefined);
    await execFileAsync("docker", ["rm", containerId]).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

export async function getWorkspaceStatus(containerId: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("docker", [
      "inspect",
      "-f",
      "{{.State.Status}}",
      containerId,
    ]);
    return stdout.trim();
  } catch {
    return "not_found";
  }
}
