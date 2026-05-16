import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

const WORKSPACE_BASE_DIR = path.resolve(process.env.WORKSPACE_BASE_DIR || "./workspace-volumes");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspace = await prisma.workspace.findUnique({ where: { sessionId: id } });
    const workspaceDir = workspace?.repoPath || path.join(WORKSPACE_BASE_DIR, id, "repo");

    const exists = await stat(workspaceDir).then((s) => s.isDirectory()).catch(() => false);
    if (!exists) {
      return NextResponse.json({ files: [] });
    }

    const lines = await listFiles(workspaceDir, workspaceDir, 0, 4);
    const tree = buildTree(lines);

    return NextResponse.json({ files: tree });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, files: [] }, { status: 500 });
  }
}

async function listFiles(root: string, current: string, depth: number, maxDepth: number): Promise<string[]> {
  if (depth > maxDepth) return [];
  const entries = await readdir(current, { withFileTypes: true }).catch(() => []);
  const lines: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "__pycache__") continue;
    const full = path.join(current, entry.name);
    const relative = path.relative(root, full);
    lines.push(relative);
    if (entry.isDirectory()) {
      lines.push(...await listFiles(root, full, depth + 1, maxDepth));
    }
  }

  return lines.sort();
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
