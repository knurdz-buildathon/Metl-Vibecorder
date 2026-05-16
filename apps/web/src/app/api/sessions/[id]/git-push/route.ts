export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const WORKSPACE_BASE_DIR = process.env.WORKSPACE_BASE_DIR || "./workspace-volumes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { commitMessage = "VibeCoder: apply changes", push = false, branch = "main" } = body;
    const repoDir = `${WORKSPACE_BASE_DIR}/${id}`;

    const git = (cmd: string) =>
      execAsync(`cd ${repoDir} && ${cmd}`, { timeout: 30_000 });

    // Configure git if not already set
    try {
      await git(`git config user.email || git config user.email "vibecoder@metl.dev"`);
      await git(`git config user.name || git config user.name "VibeCoder Agent"`);
    } catch {
      // ignore config check errors
    }

    // Stage all changes
    await git("git add -A");

    // Check if there are changes to commit
    const { stdout: diffStat } = await git("git diff --cached --stat");
    if (!diffStat.trim()) {
      return NextResponse.json({ committed: false, reason: "No changes to commit" });
    }

    // Commit
    await git(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

    let pushResult: any = null;
    if (push) {
      const { stdout, stderr } = await git(`git push origin ${branch}`).catch((e: any) => ({
        stdout: "",
        stderr: e.message,
      }));
      pushResult = { stdout, stderr: stderr || null };
    }

    return NextResponse.json({ committed: true, pushResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
