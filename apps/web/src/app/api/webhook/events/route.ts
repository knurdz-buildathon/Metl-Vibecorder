import { NextResponse } from "next/server";
import { publishEvent } from "@/lib/events";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, type, payload } = body;

    if (!sessionId || !type) {
      return NextResponse.json(
        { error: "Missing sessionId or type" },
        { status: 400 }
      );
    }

    publishEvent(sessionId, type, payload || {});

    return NextResponse.json({ published: true, type, sessionId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
