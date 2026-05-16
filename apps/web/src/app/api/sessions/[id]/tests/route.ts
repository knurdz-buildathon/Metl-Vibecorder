import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const checkRuns = await prisma.checkRun.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ checkRuns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
