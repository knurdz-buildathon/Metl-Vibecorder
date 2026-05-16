import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAgentGenerate } from "@/lib/orchestrator";
import { publishEvent } from "@/lib/events";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: { messages: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const modeStr = (session.mode as string) || "AGENT";
    const nextStatusMap: Record<string, string> = {
      ASK: "context_creating",
      PLAN: "planning",
      AGENT: "implementing",
      REPAIR: "fixing",
      REVIEW: "repo_analyzing",
    };
    const nextStatus = nextStatusMap[modeStr] || "implementing";

    await prisma.session.update({
      where: { id },
      data: { status: nextStatus as any },
    });

    publishEvent(id, "status_change", { status: nextStatus, mode: modeStr });

    // Build context from conversation
    const contextMessages = session.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    // Call agent service asynchronously
    (async () => {
      try {
        publishEvent(id, "agent_call_start", { mode: modeStr });

        const result = await callAgentGenerate({
          session_id: id,
          mode: modeStr.toLowerCase(),
          user_prompt: session.userPrompt,
          project_context: contextMessages,
        });

        publishEvent(id, "agent_call_complete", { result });

        // Update session with result and store bot message
        const responseMessage = result.message || result.summary || result.content || "";
        if (responseMessage) {
          await prisma.chatMessage.create({
            data: {
              sessionId: id,
              role: "assistant",
              content: responseMessage,
              mode: modeStr as any,
            },
          });
          publishEvent(id, "new_message", { role: "assistant", content: responseMessage });
        }

        // Handle plan approval mode
        if (modeStr === "PLAN" && result?.plan) {
          await prisma.session.update({
            where: { id },
            data: { status: "awaiting_plan_approval" as any },
          });
          publishEvent(id, "awaiting_approval", { type: "plan" });
        } else {
          await prisma.session.update({
            where: { id },
            data: { status: "completed" as any },
          });
          publishEvent(id, "status_change", { status: "completed" });
        }
      } catch (err: any) {
        console.error("Agent async call failed:", err);
        publishEvent(id, "agent_error", { error: err.message });
        await prisma.session.update({
          where: { id },
          data: { status: "failed" as any },
        });
        publishEvent(id, "status_change", { status: "failed" });
      }
    })();

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
