import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const WORKSPACE_BASE_DIR = process.env.WORKSPACE_BASE_DIR || "./workspace-volumes";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceDir = `${WORKSPACE_BASE_DIR}/${id}`;

    // Check if workspace directory exists
    try {
      await execAsync(`test -d ${workspaceDir}`);
    } catch {
      return NextResponse.json({ files: [] });
    }

    // List files recursively up to depth 4
    const { stdout } = await execAsync(
      `cd ${workspaceDir} && find . -maxdepth 4 -not -path '*/\\.*' -not -path '*/node_modules/*' -not -path '*/__pycache__/*' | sort`
    );

    const lines = stdout.trim().split("\n").filter(Boolean);
    const tree = buildTree(lines);

    return NextResponse.json({ files: tree });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, files: [] }, { status: 500 });
  }
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
}

function buildTree(lines: string[]): TreeNode[] {
  const root: TreeNode = { name: "root", path: ".", type: "directory", children: [] };

  for (const line of lines) {
    if (line === ".") continue;
    const parts = line.replace(/^\.\//, "").split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const path = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;

      let child = current.children?.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          path,
          type: isFile ? "file" : "directory",
          children: isFile ? undefined : [],
        };
        current.children!.push(child);
      }
      current = child;
    }
  }

  return root.children || [];
}
