const AGENT_URL = process.env.AGENT_SERVICE_URL || "http://localhost:8000";

export async function callAgentGenerate(payload: {
  session_id: string;
  mode: string;
  user_prompt: string;
  repo_path?: string;
  project_context?: string;
  approved_plan?: string;
}) {
  const res = await fetch(`${AGENT_URL}/generate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent error: ${res.status} ${err}`);
  }
  return res.json();
}

export async function callAgentRepair(payload: {
  session_id: string;
  repo_path: string;
  error_logs: string;
  attempt: number;
}) {
  const res = await fetch(`${AGENT_URL}/repair/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent repair error: ${res.status} ${err}`);
  }
  return res.json();
}

export async function callAgentReview(payload: {
  session_id: string;
  repo_path: string;
  files_changed: string[];
}) {
  const res = await fetch(`${AGENT_URL}/review/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent review error: ${res.status} ${err}`);
  }
  return res.json();
}

export async function callAgentChecks(payload: {
  session_id: string;
  check_type?: string;
}) {
  const res = await fetch(`${AGENT_URL}/checks/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent check error: ${res.status} ${err}`);
  }
  return res.json();
}

export async function callAgentSmokeTest(payload: {
  session_id: string;
  url?: string;
}) {
  const res = await fetch(`${AGENT_URL}/checks/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: payload.session_id,
      check_type: "playwright",
      url: payload.url,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent smoke test error: ${res.status} ${err}`);
  }
  return res.json();
}
