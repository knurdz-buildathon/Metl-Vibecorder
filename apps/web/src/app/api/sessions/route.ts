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
        status: "created",
        userPrompt: body.userPrompt,
        modelUsed: process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
        promptVersion: "0.1.0",
      },
    });

    // Create Docker workspace and persist URL
    const workspace = await createWorkspace(session.id);
    if (workspace.url) {
      await prisma.session.update({
        where: { id: session.id },
        data: { workspaceUrl: workspace.url },
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

    return NextResponse.json({ session: { ...session, workspaceUrl: workspace.url || null } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
