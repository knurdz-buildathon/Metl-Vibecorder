import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { sessions: { orderBy: { createdAt: "desc" } } },
    });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
