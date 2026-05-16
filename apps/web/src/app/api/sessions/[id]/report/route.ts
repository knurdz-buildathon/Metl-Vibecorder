import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: { messages: true, checkRuns: true, agentRuns: true, fileChanges: true, finalReport: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        userPrompt: session.userPrompt,
        modelUsed: session.modelUsed,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      messages: session.messages?.map((m) => ({
        role: m.role,
        content: m.content,
        mode: m.mode,
        createdAt: m.createdAt,
      })),
      checkRuns: session.checkRuns?.map((c) => ({
        type: c.type,
        status: c.status,
        stdout: c.stdout,
        stderr: c.stderr,
        createdAt: c.createdAt,
      })),
      agentRuns: session.agentRuns?.map((a) => ({
        mode: a.mode,
        succeeded: a.succeeded,
        model: a.model,
        startedAt: a.startedAt,
        endedAt: a.endedAt,
      })),
      finalReport: session.finalReport,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.finalReport.delete({ where: { sessionId: id } });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ deleted: false, reason: "Report not found" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
