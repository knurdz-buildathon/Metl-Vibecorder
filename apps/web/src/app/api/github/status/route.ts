import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    configured: !!((process.env.GITHUB_ID && process.env.GITHUB_SECRET) || process.env.GITHUB_TOKEN),
    clientId: process.env.GITHUB_ID || null,
    tokenConfigured: !!process.env.GITHUB_TOKEN,
  });
}
