import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ projects: [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ created: true, id: "proj_stub", ...body });
}
