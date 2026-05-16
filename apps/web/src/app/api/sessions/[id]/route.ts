import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        checkRuns: { orderBy: { createdAt: "asc" } },
        fileChanges: { orderBy: { createdAt: "asc" } },
        agentRuns: true,
        approvalRequests: true,
      },
    });
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.session.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
