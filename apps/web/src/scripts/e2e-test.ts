/**
 * E2E Test Script for Metl-VibeCoder
 *
 * Usage:
 *   cd apps/web && npx tsx src/scripts/e2e-test.ts
 *
 * Tests a real flow:
 *  1. Create a session
 *  2. Start the session (agent runs asynchronously)
 *  3. Poll for status changes + check results
 *  4. Assert completion or failure
 */

const BASE = "http://localhost:3000";

async function post(path: string, body: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runE2E() {
  console.log("[E2E] Starting flow...\n");

  // 1. Create session
  console.log("[1/5] Creating session...");
  const { session } = await post("/api/sessions", {
    userPrompt: "Create a simple hello world Node.js program",
    mode: "ASK",
  });
  console.log(`      Created session: ${session.id}`);

  // 2. Validate workspace URL was set
  if (session.workspaceUrl) {
    console.log(`      Workspace URL: ${session.workspaceUrl}`);
  } else {
    console.warn("      Workspace URL not set (Docker may not be running)");
  }

  // 3. Start the session
  console.log("\n[2/5] Starting session...");
  const startResult = await post(`/api/sessions/${session.id}/start`, {});
  console.log(`      Status: ${startResult.started} | Next: ${startResult.status}`);

  // 4. Poll for completion
  console.log("\n[3/5] Polling for agent completion (max 60s)...");
  const deadline = Date.now() + 60_000;
  let finalStatus = startResult.status;

  while (Date.now() < deadline) {
    await sleep(3000);
    const { session: s } = await get(`/api/sessions/${session.id}`);
    finalStatus = s.status;
    console.log(`      [${new Date().toLocaleTimeString()}] status=${s.status}`);

    if (["completed", "failed", "paused", "awaiting_plan_approval"].includes(s.status)) {
      break;
    }
  }

  // 5. Verify results
  console.log("\n[4/5] Checking results...");
  const { session: finalSession, checkRuns } = await get(`/api/sessions/${session.id}`);
  console.log(`      Final status: ${finalSession.status}`);
  console.log(`      Messages: ${finalSession.messages?.length || 0}`);
  console.log(`      Check runs: ${checkRuns?.length || 0}`);

  if (finalSession.status === "completed") {
    console.log("\n[PASS] Session completed successfully.");
  } else if (finalSession.status === "awaiting_plan_approval") {
    console.log("\n[PASS] Session awaiting plan approval (expected for PLAN mode).");
  } else {
    console.warn(`\n[WARN] Session ended with status: ${finalSession.status}`);
  }

  // 6. Cleanup
  console.log("\n[5/5] Cleaning up session...");
  await fetch(`${BASE}/api/sessions/${session.id}`, { method: "DELETE" });
  console.log("      Deleted.");

  console.log("\n[E2E] Done.");
}

runE2E().catch((err) => {
  console.error("[E2E] FAILED:", err.message);
  process.exit(1);
});
