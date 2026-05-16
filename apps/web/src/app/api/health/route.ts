import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const AGENT_URL = process.env.AGENT_SERVICE_URL || "http://localhost:8000";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

async function checkDatabase(): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latency: Date.now() - start };
  } catch (e: any) {
    return { ok: false, latency: Date.now() - start, error: e.message };
  }
}

async function checkRedis(): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    const [host, port] = REDIS_URL.replace("redis://", "").split(":");
    const res = await fetch(`http://${host}:${parseInt(port || "6379")}`, { method: "HEAD", signal: AbortSignal.timeout(2000) });
    return { ok: true, latency: Date.now() - start };
  } catch {
    // Redis protocol isn't HTTP - just check if the port responds
    try {
      const net = (await import("node:net")).default;
      const result = await new Promise<{ ok: boolean; latency: number }>((resolve) => {
        const [host, port] = REDIS_URL.replace("redis://", "").split(":");
        const socket = net.connect(parseInt(port || "6379"), host || "localhost");
        const timer = setTimeout(() => { socket.end(); resolve({ ok: false, latency: Date.now() - start }); }, 2000);
        socket.on("connect", () => {
          clearTimeout(timer);
          socket.end();
          resolve({ ok: true, latency: Date.now() - start });
        });
        socket.on("error", () => {
          clearTimeout(timer);
          resolve({ ok: false, latency: Date.now() - start });
        });
      });
      return result;
    } catch {
      return { ok: false, latency: Date.now() - start, error: "Redis unreachable" };
    }
  }
}

async function checkAgent(): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(`${AGENT_URL}/health/`, { signal: AbortSignal.timeout(3000) });
    return { ok: res.ok, latency: Date.now() - start };
  } catch (e: any) {
    return { ok: false, latency: Date.now() - start, error: e.message };
  }
}

export async function GET() {
  const startedAt = Date.now();
  const [db, redis, agent] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkAgent(),
  ]);

  const allOk = db.ok && redis.ok && agent.ok;

  return NextResponse.json(
    {
      service: "metl-vibecoder-web",
      version: "0.1.0",
      healthy: allOk,
      totalLatency: Date.now() - startedAt,
      dependencies: { db, redis, agent },
    },
    { status: allOk ? 200 : 503 }
  );
}
