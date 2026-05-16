import { NextResponse } from "next/server";
import { callAgentSmokeTest } from "@/lib/orchestrator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await callAgentSmokeTest({
      session_id: sessionId,
      url: body.url,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Smoke test failed" },
      { status: 500 }
    );
  }
}
