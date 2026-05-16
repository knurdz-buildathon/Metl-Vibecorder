import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishEvent } from "@/lib/events";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
  try {
    const { id: sessionId, approvalId } = await params;

    const approval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: { approved: false, respondedAt: new Date() },
    });

    if (approval.type === "PLAN") {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "paused" },
      });
      publishEvent(sessionId, "status_change", { status: "paused" });
    }

    return NextResponse.json({ rejected: true, approvalId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
