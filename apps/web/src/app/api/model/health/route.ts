import { NextResponse } from "next/server";

export async function GET() {
  const geminiConfigured = !!(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
  return NextResponse.json({
    provider: "gemini",
    mode: process.env.GEMINI_PROVIDER || "developer",
    healthy: geminiConfigured,
    configured: geminiConfigured,
    model: process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
  });
}
