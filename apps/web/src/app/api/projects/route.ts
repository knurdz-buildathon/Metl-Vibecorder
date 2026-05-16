import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { sessions: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        repoUrl: body.repoUrl,
        githubRepo: body.githubRepo,
        language: body.language || "typescript",
        userId: body.userId || "guest",
      },
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
