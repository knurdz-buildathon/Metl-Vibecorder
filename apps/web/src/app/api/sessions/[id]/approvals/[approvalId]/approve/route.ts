import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAgentGenerate } from "@/lib/orchestrator";
import { publishEvent } from "@/lib/events";
import { persistAgentResult, runRepairLoop, runReviewAndReport } from "@/lib/workflow";

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

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { workspace: true },
      });
      if (session) {
        void (async () => {
          try {
            const result = await callAgentGenerate({
              session_id: sessionId,
              mode: "agent",
              user_prompt: session.userPrompt,
              approved_plan: approval.body,
              repo_path: session.workspace?.repoPath,
            });
            await persistAgentResult(sessionId, "AGENT", result);

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

            let finalResult = result;
            if (result.completion_status === "needs_repair") {
              finalResult = await runRepairLoop(session, result);
            }
            await runReviewAndReport(session, finalResult);

            const nextStatus =
              finalResult?.status === "error" || finalResult?.completion_status === "needs_repair"
                ? "failed"
                : "completed";

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
