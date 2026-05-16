import { NextResponse } from "next/server";

export async function GET() {
  // TODO: call Python agent /health endpoint
  const agentUrl = process.env.AGENT_SERVICE_URL || "http://localhost:8000";
  let agentHealthy = false;
  try {
    const res = await fetch(`${agentUrl}/health/`, { signal: AbortSignal.timeout(3000) });
    agentHealthy = res.ok;
  } catch {
    agentHealthy = false;
  }

  return NextResponse.json({
    service: "metl-vibecoder-agent",
    version: "0.1.0",
    healthy: agentHealthy,
    url: agentUrl,
  });
}
