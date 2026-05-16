export type SessionMode = "ask" | "plan" | "agent" | "repair" | "review";

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
  status: "pending" | "passed" | "failed";
  command: string;
  stdout?: string;
  stderr?: string;
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
