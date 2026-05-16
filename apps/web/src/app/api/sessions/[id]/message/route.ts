import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAgentGenerate } from "@/lib/orchestrator";
import { publishEvent } from "@/lib/events";
import { persistAgentResult } from "@/lib/workflow";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();

    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: body.role,
        content: body.content,
        mode: body.mode || "ASK",
      },
    });

    // Auto-trigger agent response in ASK mode after user message
    if (body.role === "user") {
      (async () => {
        try {
          const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { workspace: true },
          });
          publishEvent(sessionId, "status_change", { status: "repo_analyzing" });
          await prisma.session.update({
            where: { id: sessionId },
            data: { status: "repo_analyzing" as any },
          });

          const result = await callAgentGenerate({
            session_id: sessionId,
            mode: "ask",
            user_prompt: body.content,
            repo_path: session?.workspace?.repoPath,
          });
          await persistAgentResult(sessionId, "ASK", result);

          const assistantContent = result.message || result.summary || "Agent produced no response.";

          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: "assistant",
              content: assistantContent,
              mode: body.mode || "ASK",
            },
          });

          publishEvent(sessionId, "new_message", { role: "assistant", content: assistantContent });
          publishEvent(sessionId, "status_change", { status: "completed" });
          await prisma.session.update({
            where: { id: sessionId },
            data: { status: "completed" as any },
          });
        } catch (err: any) {
          publishEvent(sessionId, "agent_error", { error: err.message });
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: "assistant",
              content: `Error: ${err.message}`,
              mode: body.mode || "ASK",
            },
          });
          publishEvent(sessionId, "status_change", { status: "failed" });
          await prisma.session.update({
            where: { id: sessionId },
            data: { status: "failed" as any },
          }).catch(() => undefined);
        }
      })();
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
