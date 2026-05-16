// These match Prisma enums exactly (UPPERCASE for enums)
export type SessionMode = "ASK" | "PLAN" | "AGENT" | "REPAIR" | "REVIEW";

export type SessionStatus =
  | "created"
  | "workspace_creating"
  | "workspace_ready"
  | "repo_cloning"
  | "repo_analyzing"
  | "context_creating"
  | "clarifying"
  | "planning"
  | "awaiting_plan_approval"
  | "implementing"
  | "awaiting_commit_approval"
  | "testing"
  | "fixing"
  | "repairing"
  | "ready_for_deployment"
  | "waiting_deployment_approval"
  | "deployment_handoff"
  | "completed"
  | "failed"
  | "paused";

export interface Session {
  id: string;
  projectId: string;
  mode: SessionMode;
  status: SessionStatus;
  userPrompt: string;
  workspaceId?: string;
  workspaceUrl?: string;
  workspace?: Workspace;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  sessionId: string;
  provider: string;
  containerId?: string;
  rootPath: string;
  repoPath: string;
  internalPath: string;
  ideUrl?: string;
  previewUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  mode?: SessionMode;
  createdAt: string;
}

export interface CheckRun {
  id: string;
  sessionId: string;
  type: string;
  status: "pending" | "passed" | "failed" | "skipped";
  command: string;
  stdout?: string;
  stderr?: string;
  summary?: string;
  error?: string;
  durationMs?: number;
  createdAt: string;
}

export interface FileChange {
  id: string;
  sessionId: string;
  filePath: string;
  operation: "created" | "modified" | "deleted";
  diff?: string;
  createdAt: string;
}
