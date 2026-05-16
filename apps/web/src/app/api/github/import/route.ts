export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const repoUrl = body.repoUrl as string;
    const githubRepo = body.githubRepo as string;

    const project = await prisma.project.create({
      data: {
        name: body.name || githubRepo?.split("/")[1] || "Imported Repo",
        description: `Imported from ${repoUrl}`,
        repoUrl,
        githubRepo,
        language: body.language || "typescript",
        userId: body.userId || "guest",
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}