import { NextResponse } from "next/server";
import { callAgentChecks } from "@/lib/orchestrator";
import { persistAgentResult } from "@/lib/workflow";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await callAgentChecks({
      session_id: sessionId,
      check_type: body.checkType || body.check_type,
    });
    await persistAgentResult(sessionId, "REVIEW", result);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
