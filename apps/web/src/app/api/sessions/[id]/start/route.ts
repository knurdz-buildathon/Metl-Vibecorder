import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAgentGenerate } from "@/lib/orchestrator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update status
    const nextStatus =
      session.mode === "ask"
        ? "context_creating"
        : session.mode === "plan"
        ? "planning"
        : "implementing";

    await prisma.session.update({
      where: { id },
      data: { status: nextStatus },
    });

    // Call agent service asynchronously (fire-and-forget)
    callAgentGenerate({
      session_id: id,
      mode: session.mode.toLowerCase(),
      user_prompt: session.userPrompt,
    }).catch((err) => {
      console.error("Agent call failed:", err);
    });

    return NextResponse.json({
      started: true,
      sessionId: id,
      mode: session.mode,
      status: nextStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
