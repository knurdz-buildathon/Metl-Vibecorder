import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAgentGenerate } from "@/lib/orchestrator";
import { publishEvent } from "@/lib/events";

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

    publishEvent(sessionId, "plan_approved", { approvalId });

    if (approval.type === "PLAN") {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "implementing" as any },
      });
      publishEvent(sessionId, "status_change", { status: "implementing" });

      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (session) {
        void (async () => {
          try {
            const result = await callAgentGenerate({
              session_id: sessionId,
              mode: "agent",
              user_prompt: session.userPrompt,
              approved_plan: approval.body,
            });

            const responseMessage = result.message || result.summary || "";
            if (responseMessage) {
              await prisma.chatMessage.create({
                data: {
                  sessionId,
                  role: "assistant",
                  content: responseMessage,
                  mode: session.mode as any,
                },
              });
              publishEvent(sessionId, "new_message", { role: "assistant", content: responseMessage });
            }

            const completionStatus = result.completion_status || "done";
            let nextStatus = "completed";
            if (completionStatus === "needs_repair") {
              nextStatus = "repairing";
            } else if (completionStatus === "needs_approval") {
              nextStatus = "awaiting_plan_approval";
            }

            await prisma.session.update({
              where: { id: sessionId },
              data: { status: nextStatus as any },
            });
            publishEvent(sessionId, "status_change", { status: nextStatus });
          } catch (err: any) {
            console.error("Agent call failed after approval:", err);
            await prisma.session.update({
              where: { id: sessionId },
              data: { status: "failed" as any },
            });
            publishEvent(sessionId, "status_change", { status: "failed" });
            publishEvent(sessionId, "agent_error", { error: err.message });
          }
        })();
      }
    }

    return NextResponse.json({ approved: true, approvalId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
