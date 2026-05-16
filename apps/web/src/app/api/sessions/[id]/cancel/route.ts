import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishEvent } from "@/lib/events";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.update({
      where: { id },
      data: { status: "paused" as any },
    });
    publishEvent(id, "status_change", { status: "paused" });
    return NextResponse.json({ cancelled: true, sessionId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
