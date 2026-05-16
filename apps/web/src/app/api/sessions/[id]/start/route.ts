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

    // Determine next status based on session mode
    const modeStr: string = (session.mode as string) || "AGENT";
    let nextStatus: string;
    if (modeStr === "ASK") {
      nextStatus = "context_creating";
    } else if (modeStr === "PLAN") {
      nextStatus = "planning";
    } else {
      nextStatus = "implementing";
    }

    await prisma.session.update({
      where: { id },
      data: { status: nextStatus as any },
    });

    // Call agent service asynchronously (fire-and-forget)
    callAgentGenerate({
      session_id: id,
      mode: modeStr.toLowerCase(),
      user_prompt: session.userPrompt,
    }).catch((err: Error) => {
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