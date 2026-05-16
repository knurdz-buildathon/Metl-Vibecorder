import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    service: "metl-vibecoder-web",
    version: "0.1.0",
    status: "ok",
    gemini: {
      configured: !!process.env.GEMINI_API_KEY,
      provider: process.env.GEMINI_PROVIDER || "developer",
    },
  });
}
