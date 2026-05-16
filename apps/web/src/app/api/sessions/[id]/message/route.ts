import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAgentGenerate } from "@/lib/orchestrator";
import { publishEvent } from "@/lib/events";

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

    // Auto-trigger agent reasoning in ASK mode after user message
    if (body.role === "user") {
      (async () => {
        try {
          publishEvent(sessionId, "status_change", { status: "repo_analyzing" });

          const result = await callAgentGenerate({
            session_id: sessionId,
            mode: "ask",
            user_prompt: body.content,
          });

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
        }
      })();
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
