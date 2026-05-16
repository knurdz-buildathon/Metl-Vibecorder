import { NextResponse } from "next/server";
import { subscribeToEvents } from "@/lib/events";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected", sessionId: id });

      const handler = (evt: any) => {
        send(evt);
      };

      const unsubscribe = subscribeToEvents(id, handler);

      // Keep-alive heartbeat
      const interval = setInterval(() => send({ type: "heartbeat", at: Date.now() }), 15000);

      // Cleanup
      return () => {
        clearInterval(interval);
        unsubscribe();
        controller.close();
      };
    },
    cancel(reason) {
      console.log(`SSE stream canceled for session ${id}:`, reason);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
