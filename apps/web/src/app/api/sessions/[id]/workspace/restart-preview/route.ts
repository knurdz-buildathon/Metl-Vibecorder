import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspace = await prisma.workspace.findUnique({ where: { sessionId: id } });
  return NextResponse.json({
    restarted: false,
    reason: "Preview process management is not configured for this workspace yet.",
    workspace,
  });
}
