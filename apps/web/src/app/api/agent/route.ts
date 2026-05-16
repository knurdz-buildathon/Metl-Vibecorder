import { NextResponse } from "next/server";

const AGENT_URL = process.env.AGENT_SERVICE_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${AGENT_URL}/`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`Agent responded with ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        service: "metl-vibecoder-agent",
        status: "unreachable",
        url: AGENT_URL,
      },
      { status: 503 }
    );
  }
}
