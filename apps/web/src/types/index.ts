export type SessionMode = "ASK" | "PLAN" | "AGENT";

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

export type IdeStatus = "disabled" | "starting" | "ready" | "failed";
export type PreviewStatus = "disabled" | "starting" | "ready" | "failed";

export interface MessagePayload {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  mode?: SessionMode;
  createdAt: string;
}

export interface ApprovalPayload {
  id: string;
  sessionId: string;
  type: "plan" | "commit";
  status: "pending" | "approved" | "rejected";
  body?: string;
  createdAt: string;
}

export interface TestRunPayload {
  id: string;
  sessionId: string;
  name: string;
  status: "running" | "passed" | "failed" | "skipped";
  durationMs?: number;
  summary?: string;
  error?: string;
  createdAt: string;
}

export interface RestorePointPayload {
  id: string;
  sessionId: string;
  label: string;
  commitSha?: string;
  createdAt: string;
}

export interface AgentRunPayload {
  id: string;
  sessionId: string;
  mode: string;
  model: string;
  succeeded: boolean;
  latencyMs?: number;
  createdAt: string;
}

export interface IntegrationCallPayload {
  id: string;
  sessionId: string;
  provider: string;
  action: string;
  success: boolean;
  durationMs?: number;
  createdAt: string;
}

export interface FinalReportPayload {
  sessionId: string;
  summary: string;
  featuresImplemented: string[];
  filesChanged: string[];
  commits: string[];
  restorePoints: string[];
  testsRun: number;
  skippedTools: string[];
  knownLimitations: string[];
  deploymentReady: boolean;
}

export interface SessionPayload {
  id: string;
  projectName: string;
  mode: SessionMode;
  status: SessionStatus;
  repoUrl?: string;
  branchName?: string;
  ideUrl?: string;
  previewUrl?: string;
  ideStatus?: IdeStatus;
  previewStatus?: PreviewStatus;
  messages: MessagePayload[];
  approvals: ApprovalPayload[];
  testRuns: TestRunPayload[];
  restorePoints: RestorePointPayload[];
  agentRuns: AgentRunPayload[];
  integrationCalls: IntegrationCallPayload[];
  finalReport?: FinalReportPayload;
  activeModel?: string;
  activePromptVersion?: string;
}

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
