import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createWorkspace } from "@/lib/workspace";
import type { SessionMode } from "@/types";

export async function GET() {
  const sessions = await prisma.session.findMany({
    include: { project: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = (body.mode || "AGENT") as SessionMode;

    let projectId = body.projectId;
    if (!projectId) {
      // Ensure a guest user exists for unauthenticated sessions
      const guestUser = await prisma.user.upsert({
        where: { id: "guest" },
        create: { id: "guest", email: "guest@metl.dev", name: "Guest", image: null },
        update: {},
      });

      const project = await prisma.project.create({
        data: {
          name: body.name || "Untitled Session",
          description: body.userPrompt?.slice(0, 200) || "Auto-created session project",
          userId: guestUser.id,
        },
      });
      projectId = project.id;
    } else {
      // Verify the project exists
      const existing = await prisma.project.findUnique({ where: { id: projectId } });
      if (!existing) {
        return NextResponse.json({ error: "Project not found" }, { status: 400 });
      }
    }

    const session = await prisma.session.create({
      data: {
        projectId,
        mode: mode as any,
        status: "workspace_creating",
        userPrompt: body.userPrompt,
        modelUsed: process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
        promptVersion: "0.1.0",
      },
    });

    // Create Docker workspace and persist URL (best-effort for local dev).
    let workspace: any = { url: null };
    try {
      workspace = await createWorkspace(session.id);
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
      if (workspace?.url) {
        await prisma.session.update({
          where: { id: session.id },
          data: {
            workspaceId: workspace.containerId,
            workspaceUrl: workspace.url,
            status: "workspace_ready",
          },
        });
      } else {
        await prisma.session.update({
          where: { id: session.id },
          data: { status: "created" },
        });
      }
    } catch (err: any) {
      console.warn("Workspace creation skipped:", err.message);
      await prisma.session.update({
        where: { id: session.id },
        data: { status: "created" },
      });
    }

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "system",
        content: `Session started in ${mode} mode.`,
        mode: mode as any,
      },
    });

    const created = await prisma.session.findUnique({
      where: { id: session.id },
      include: { workspace: true },
    });

    return NextResponse.json({ session: created || { ...session, workspaceUrl: workspace.url || null } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
