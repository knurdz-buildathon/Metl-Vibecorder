export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createWorkspace } from "@/lib/workspace";
import simpleGit from "simple-git";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const repoUrl = body.repoUrl as string;
    const githubRepo = body.githubRepo as string;

    if (!repoUrl) {
      return NextResponse.json({ error: "Missing repoUrl" }, { status: 400 });
    }
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/.test(repoUrl)) {
      return NextResponse.json({ error: "Only HTTPS GitHub repository URLs are supported" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { id: "guest" },
      create: { id: "guest", email: "guest@metl.dev", name: "Guest", image: null },
      update: {},
    });

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
    await prisma.workspace.upsert({
      where: { sessionId: session.id },
      create: {
        sessionId: session.id,
        provider: "local-docker",
        containerId: workspace.containerId || null,
        rootPath: workspace.rootPath,
        repoPath: workspace.repoPath,
        internalPath: workspace.internalPath,
        ideUrl: workspace.url || null,
        previewUrl: workspace.previewUrl || null,
        status: workspace.status,
      },
      update: {
        containerId: workspace.containerId || null,
        rootPath: workspace.rootPath,
        repoPath: workspace.repoPath,
        internalPath: workspace.internalPath,
        ideUrl: workspace.url || null,
        previewUrl: workspace.previewUrl || null,
        status: workspace.status,
      },
    });
    if (workspace.url) {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          workspaceId: workspace.containerId,
          workspaceUrl: workspace.url,
          status: "repo_cloning" as any,
        },
      });
    }

    // Git clone inside workspace volume
    try {
      await simpleGit().clone(repoUrl, workspace.repoPath, ["--depth", "1"]);
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
