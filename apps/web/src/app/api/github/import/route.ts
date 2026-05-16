export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createWorkspace } from "@/lib/workspace";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const repoUrl = body.repoUrl as string;
    const githubRepo = body.githubRepo as string;

    if (!repoUrl) {
      return NextResponse.json({ error: "Missing repoUrl" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: body.name || githubRepo?.split("/")[1] || "Imported Repo",
        description: `Imported from ${repoUrl}`,
        repoUrl,
        githubRepo,
        language: body.language || "typescript",
        userId: body.userId || "guest",
      },
    });

    const session = await prisma.session.create({
      data: {
        projectId: project.id,
        mode: "AGENT" as any,
        status: "repo_cloning" as any,
        userPrompt: `Import and analyze ${repoUrl}`,
        modelUsed: process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
        promptVersion: "0.1.0",
      },
    });

    // Start workspace
    const workspace = await createWorkspace(session.id);
    if (workspace.url) {
      await prisma.session.update({
        where: { id: session.id },
        data: { workspaceUrl: workspace.url, status: "repo_cloning" as any },
      });
    }

    // Git clone inside workspace volume
    const workspaceDir = `../workspace-volumes/${session.id}`;
    try {
      await execAsync(`git clone --depth 1 ${repoUrl} ${workspaceDir}/repo`);
      await prisma.session.update({
        where: { id: session.id },
        data: { status: "repo_analyzing" as any },
      });
    } catch (gitErr: any) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: "failed" as any },
      });
      return NextResponse.json(
        { error: `Git clone failed: ${gitErr.message}`, project, session },
        { status: 500 }
      );
    }

    return NextResponse.json({ project, session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
