import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createWorkspace, stopWorkspace } from "@/lib/workspace";
import { publishEvent } from "@/lib/events";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.workspace.findUnique({ where: { sessionId: id } });
    if (existing?.containerId) {
      await stopWorkspace(existing.containerId);
    }

    const workspace = await createWorkspace(id);
    await prisma.workspace.upsert({
      where: { sessionId: id },
      create: {
        sessionId: id,
        provider: "local-docker",
        containerId: workspace.containerId,
        rootPath: workspace.rootPath,
        repoPath: workspace.repoPath,
        internalPath: workspace.internalPath,
        ideUrl: workspace.url,
        previewUrl: workspace.previewUrl || null,
        status: workspace.status,
      },
      update: {
        containerId: workspace.containerId,
        rootPath: workspace.rootPath,
        repoPath: workspace.repoPath,
        internalPath: workspace.internalPath,
        ideUrl: workspace.url,
        previewUrl: workspace.previewUrl || null,
        status: workspace.status,
      },
    });
    await prisma.session.update({
      where: { id },
      data: {
        workspaceId: workspace.containerId || null,
        workspaceUrl: workspace.url || null,
        status: workspace.url ? "workspace_ready" as any : "created" as any,
      },
    });
    publishEvent(id, "workspace_restarted", { ideUrl: workspace.url, status: workspace.status });
    return NextResponse.json({ workspace });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
