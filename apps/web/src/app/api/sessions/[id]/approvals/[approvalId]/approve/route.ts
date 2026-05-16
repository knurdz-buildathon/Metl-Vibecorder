import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAgentGenerate } from "@/lib/orchestrator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
  try {
    const { id: sessionId, approvalId } = await params;

    const approval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: { approved: true, respondedAt: new Date() },
    });

    // If plan was approved, start agent implementation
    if (approval.type === "PLAN") {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "implementing" },
      });

      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (session) {
        callAgentGenerate({
          session_id: sessionId,
          mode: "agent",
          user_prompt: session.userPrompt,
          approved_plan: approval.body,
        }).catch((err) => console.error("Agent call failed:", err));
      }
    }

    return NextResponse.json({ approved: true, approvalId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
