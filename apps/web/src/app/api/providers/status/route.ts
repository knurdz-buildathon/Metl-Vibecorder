import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    gemini: {
      provider: "gemini",
      mode: process.env.GEMINI_PROVIDER || "developer",
      configured: !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      model: process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
    },
    ide: { provider: "openvscode", status: "not_started" },
    workspace: { provider: "local-docker", status: "not_started" },
    github: {
      configured: !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
    },
  });
}
