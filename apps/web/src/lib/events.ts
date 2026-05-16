import { EventEmitter } from "node:events";
import { prisma } from "@/lib/db";

const emitter = new EventEmitter();

export type ProgressEvent = {
  sessionId: string;
  type: string;
  payload?: Record<string, any>;
};

export function publishEvent(sessionId: string, type: string, payload?: Record<string, any>) {
  const evt: ProgressEvent = { sessionId, type, payload };
  emitter.emit(sessionId, evt);
  emitter.emit("all", evt);
  void prisma.sessionEvent
    .create({
      data: {
        sessionId,
        type,
        payload: payload || {},
      },
    })
    .catch(() => {
      // Event streaming should keep working even if persistence is unavailable.
    });
}

export function subscribeToEvents(
  sessionId: string,
  handler: (evt: ProgressEvent) => void
): () => void {
  emitter.on(sessionId, handler);
  return () => emitter.off(sessionId, handler);
}
