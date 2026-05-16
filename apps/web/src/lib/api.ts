import type { SessionPayload } from "@/types";

const BASE_URL = "";

export async function createSession(data: {
  projectId?: string;
  userPrompt: string;
  mode: "ASK" | "PLAN" | "AGENT";
  repoUrl?: string;
}) {
  const res = await fetch(`${BASE_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
  return res.json() as Promise<{ session: SessionPayload }>;
}

export async function getSession(id: string): Promise<{ session: SessionPayload }> {
  const res = await fetch(`${BASE_URL}/api/sessions/${id}`);
  if (!res.ok) throw new Error(`Failed to get session: ${res.status}`);
  return res.json();
}

export async function sendMessage(
  sessionId: string,
  data: { role: string; content: string; mode?: string }
) {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  return res.json();
}

export async function cancelSession(sessionId: string) {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/cancel`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to cancel: ${res.status}`);
  return res.json();
}

export async function switchMode(sessionId: string, mode: "ASK" | "PLAN" | "AGENT") {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error(`Failed to switch mode: ${res.status}`);
  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${BASE_URL}/api/health`);
  return res.json();
}

export async function getModelHealth() {
  const res = await fetch(`${BASE_URL}/api/model/health`);
  return res.json();
}

export async function getAgentHealth() {
  const res = await fetch(`${BASE_URL}/api/agents/health`);
  return res.json();
}

export async function getProviderStatus() {
  const res = await fetch(`${BASE_URL}/api/providers/status`);
  return res.json();
}

export async function startSession(sessionId: string) {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/start`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to start session: ${res.status}`);
  return res.json();
}

export async function getProjects() {
  const res = await fetch(`${BASE_URL}/api/projects`);
  if (!res.ok) throw new Error(`Failed to get projects: ${res.status}`);
  return res.json();
}

export async function createProject(data: {
  name: string;
  description?: string;
  repoUrl?: string;
  githubRepo?: string;
  language?: string;
}) {
  const res = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
  return res.json();
}

export async function approveRequest(sessionId: string, approvalId: string) {
  const res = await fetch(
    `${BASE_URL}/api/sessions/${sessionId}/approvals/${approvalId}/approve`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Failed to approve: ${res.status}`);
  return res.json();
}

export async function rejectRequest(sessionId: string, approvalId: string) {
  const res = await fetch(
    `${BASE_URL}/api/sessions/${sessionId}/approvals/${approvalId}/reject`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Failed to reject: ${res.status}`);
  return res.json();
}
