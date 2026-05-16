import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const WORKSPACE_BASE_DIR = process.env.WORKSPACE_BASE_DIR || "./workspace-volumes";

export interface WorkspaceInfo {
  containerId: string;
  url: string;
  status: string;
}

export async function createWorkspace(sessionId: string): Promise<WorkspaceInfo> {
  const containerName = `vibecoder-${sessionId.slice(0, 8)}`;
  const workspaceDir = `${WORKSPACE_BASE_DIR}/${sessionId}`;

  try {
    await execAsync(`mkdir -p ${workspaceDir}`);

    const { stdout } = await execAsync(
      `docker run -d --name ${containerName} ` +
        `-p 0:8080 ` +
        `-v ${workspaceDir}:/workspace ` +
        `-e PASSWORD=${process.env.CODE_SERVER_PASSWORD || "metlcode"} ` +
        `codercom/code-server:latest`
    );

    const containerId = stdout.trim();

    const { stdout: portOutput } = await execAsync(
      `docker port ${containerId} 8080`
    );
    const port = portOutput.trim().split(":")[1] || "8080";

    return {
      containerId,
      url: `http://localhost:${port}`,
      status: "running",
    };
  } catch (error: any) {
    console.error("Workspace creation failed:", error.message);
    return {
      containerId: "",
      url: "",
      status: "failed",
    };
  }
}

export async function deleteWorkspace(sessionId: string): Promise<boolean> {
  const containerName = `vibecoder-${sessionId.slice(0, 8)}`;
  try {
    await execAsync(`docker rm -f ${containerName} 2>/dev/null || true`);

    const workspaceDir = `${WORKSPACE_BASE_DIR}/${sessionId}`;
    await execAsync(`rm -rf ${workspaceDir}`);

    return true;
  } catch (error: any) {
    console.error("Workspace cleanup failed:", error.message);
    return false;
  }
}

export async function stopWorkspace(containerId: string): Promise<boolean> {
  try {
    await execAsync(`docker stop ${containerId} 2>/dev/null || true`);
    await execAsync(`docker rm ${containerId} 2>/dev/null || true`);
    return true;
  } catch {
    return false;
  }
}

export async function getWorkspaceStatus(containerId: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `docker inspect -f '{{.State.Status}}' ${containerId} 2>/dev/null || echo not_found`
    );
    return stdout.trim();
  } catch {
    return "not_found";
  }
}
