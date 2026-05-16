import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integrationCalls = await prisma.integrationCall.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ integrationCalls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
