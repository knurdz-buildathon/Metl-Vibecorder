import { NextResponse } from "next/server";

export async function GET() {
  const agentUrl = process.env.AGENT_SERVICE_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${agentUrl}/health/`, { signal: AbortSignal.timeout(3000) });
    const health = await res.json();
    return NextResponse.json({
      provider: "gemini",
      mode: health.gemini_provider || process.env.GEMINI_PROVIDER || "developer",
      healthy: !!health.gemini_healthy,
      configured: !!health.gemini_configured,
      model: health.model || process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
      agentReachable: res.ok,
    }, { status: res.ok ? 200 : 503 });
  } catch (error: any) {
    const geminiConfigured = !!(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS
    );
    return NextResponse.json({
      provider: "gemini",
      mode: process.env.GEMINI_PROVIDER || "developer",
      healthy: false,
      configured: geminiConfigured,
      model: process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools",
      agentReachable: false,
      error: error.message,
    }, { status: 503 });
  }
}
