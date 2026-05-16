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
    // Ensure workspace directory exists
    await execAsync(`mkdir -p ${workspaceDir}`);

    // Start code-server container
    const { stdout } = await execAsync(
      `docker run -d --name ${containerName} ` +
        `-p 0:8080 ` +
        `-v ${workspaceDir}:/workspace ` +
        `-e PASSWORD=${process.env.CODE_SERVER_PASSWORD || "metlcode"} ` +
        `codercom/code-server:latest`
    );

    const containerId = stdout.trim();

    // Get assigned port
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

export async function stopWorkspace(containerId: string): Promise<boolean> {
  try {
    await execAsync(`docker stop ${containerId}`);
    await execAsync(`docker rm ${containerId}`);
    return true;
  } catch {
    return false;
  }
}

export async function getWorkspaceStatus(containerId: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `docker inspect -f '{{.State.Status}}' ${containerId}`
    );
    return stdout.trim();
  } catch {
    return "not_found";
  }
}
