export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "path";
import simpleGit from "simple-git";
import { prisma } from "@/lib/db";

const WORKSPACE_BASE_DIR = path.resolve(process.env.WORKSPACE_BASE_DIR || "./workspace-volumes");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { commitMessage = "VibeCoder: apply changes", push = false, branch = "main" } = body;
    const workspace = await prisma.workspace.findUnique({ where: { sessionId: id } });
    const repoDir = workspace?.repoPath || path.join(WORKSPACE_BASE_DIR, id, "repo");
    const git = simpleGit({ baseDir: repoDir, binary: "git", maxConcurrentProcesses: 1 });

    // Configure git if not already set
    await git.addConfig("user.email", "vibecoder@metl.dev");
    await git.addConfig("user.name", "VibeCoder Agent");

    // Stage all changes
    await git.add(".");

    // Check if there are changes to commit
    const status = await git.status();
    if (status.files.length === 0) {
      return NextResponse.json({ committed: false, reason: "No changes to commit" });
    }

    // Commit
    const commit = await git.commit(commitMessage);

    let pushResult: any = null;
    if (push) {
      try {
        pushResult = await git.push("origin", branch);
      } catch (e: any) {
        pushResult = { error: e.message };
      }
    }

    return NextResponse.json({ committed: true, commit, pushResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
