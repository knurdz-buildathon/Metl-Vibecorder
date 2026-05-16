import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { SessionMode, SessionStatus } from "@/types";

export async function GET() {
  const sessions = await prisma.session.findMany({
    include: { project: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode: SessionMode = body.mode || "agent";
    const status: SessionStatus = "created";

    const session = await prisma.session.create({
      data: {
        projectId: body.projectId,
        mode,
        status,
        userPrompt: body.userPrompt,
        modelUsed: process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
        promptVersion: "0.1.0",
      },
    });

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "system",
        content: `Session started in ${mode.toUpperCase()} mode.`,
        mode,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
