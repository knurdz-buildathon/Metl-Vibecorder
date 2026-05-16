"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import CloudIdeLayout from "@/components/workspace/cloud-ide-layout";
import SettingsModal from "@/components/layout/settings-modal";
import { sendMessage, getSession, switchMode } from "@/lib/api";
import { useSessionEvents } from "@/hooks/use-session-events";
import type {
  SessionMode,
  SessionStatus,
  ChatMessage,
  CheckRun,
  FileChange,
  TestRunPayload,
  RestorePointPayload,
  AgentRunPayload,
  ApprovalPayload,
  IdeStatus,
  PreviewStatus,
  FinalReportPayload,
} from "@/types";

export default function SessionWorkspacePage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { connected, events } = useSessionEvents(sessionId);

  const [mode, setMode] = useState<SessionMode>("AGENT");
  const [status, setStatus] = useState<SessionStatus>("created");
  const [projectName, setProjectName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [ideUrl, setIdeUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [ideStatus, setIdeStatus] = useState<IdeStatus>("disabled");
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("disabled");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [checks, setChecks] = useState<CheckRun[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] SSE ${connected ? "connected" : "disconnected"}`,
  ]);
  const [testRuns, setTestRuns] = useState<TestRunPayload[]>([]);
  const [restorePoints, setRestorePoints] = useState<RestorePointPayload[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRunPayload[]>([]);
  const [approvals, setApprovals] = useState<ApprovalPayload[]>([]);
  const [finalReport, setFinalReport] = useState<FinalReportPayload | undefined>(undefined);
  const [activeModel, setActiveModel] = useState<string | undefined>(undefined);
  const [activePromptVersion, setActivePromptVersion] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(() => {
    getSession(sessionId)
      .then(({ session }) => {
        setMode(session.mode);
        setStatus(session.status);
        setProjectName(session.projectName);
        setBranchName(session.branchName || "");
        setIdeUrl(session.ideUrl || "");
        setPreviewUrl(session.previewUrl || "");
        setIdeStatus(session.ideStatus || "disabled");
        setPreviewStatus(session.previewStatus || "disabled");
        setMessages(session.messages || []);
        setChecks([]); // derived from testRuns or kept empty if unused
        setFileChanges([]); // populate from session if available
        setTestRuns(session.testRuns || []);
        setRestorePoints(session.restorePoints || []);
        setAgentRuns(session.agentRuns || []);
        setApprovals(session.approvals || []);
        setFinalReport(session.finalReport);
        setActiveModel(session.activeModel);
        setActivePromptVersion(session.activePromptVersion);
        setLoading(false);
      })
      .catch((e: any) => {
        setError(e.message || "Failed to load session");
        setLoading(false);
      });
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    load();
    const interval = setInterval(() => {
      if (!cancelled) load();
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);

  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];
    if (!latest) return;

    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${latest.type || "event"}`,
    ]);

    switch (latest.type) {
      case "status_change":
        setStatus(latest.payload?.status || status);
        break;
      case "new_message":
        if (latest.payload?.content && latest.payload?.role === "assistant") {
          const msg: ChatMessage = {
            id: `sse-${Date.now()}`,
            sessionId,
            role: "assistant",
            content: latest.payload.content,
            mode: latest.payload.mode || mode,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, msg]);
        }
        break;
      case "file_change":
        if (latest.payload?.file_path) {
          const fc: FileChange = {
            id: `fc-${Date.now()}`,
            sessionId,
            filePath: latest.payload.file_path,
            operation: latest.payload.operation || "modified",
            diff: "",
            createdAt: new Date().toISOString(),
          };
          setFileChanges((prev) => [...prev, fc]);
        }
        break;
      case "awaiting_approval":
        setStatus("awaiting_plan_approval");
        break;
      case "agent_error":
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Agent error: ${latest.payload?.error || "Unknown error"}`,
        ]);
        setStatus("failed");
        break;
      case "plan_approved":
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Plan approved`,
        ]);
        break;
      default:
        break;
    }
  }, [events, sessionId]);

  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId,
      role: "user",
      content,
      mode,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      await sendMessage(sessionId, { role: "user", content, mode: mode as string });
    } catch (e: any) {
      setLogs((prev) => [...prev, `Error sending message: ${e.message}`]);
    }
  };

  const handleModeChange = async (newMode: SessionMode) => {
    try {
      await switchMode(sessionId, newMode);
      setMode(newMode);
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Mode changed to ${newMode}`,
      ]);
    } catch (e: any) {
      setLogs((prev) => [...prev, `Failed to switch mode: ${e.message}`]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive text-sm">{error}</p>
          <a href="/" className="text-foreground underline text-sm">
            Return to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <CloudIdeLayout
        title={`Session: ${sessionId.slice(0, 8)}`}
        projectName={projectName}
        branchName={branchName}
        ideUrl={ideUrl || undefined}
        previewUrl={previewUrl || undefined}
        ideStatus={ideStatus}
        previewStatus={previewStatus}
        mode={mode}
        status={status}
        messages={messages}
        checks={checks}
        fileChanges={fileChanges}
        logs={logs}
        testRuns={testRuns}
        restorePoints={restorePoints}
        agentRuns={agentRuns}
        approvals={approvals}
        activeModel={activeModel}
        activePromptVersion={activePromptVersion}
        onSendMessage={handleSendMessage}
        onModeChange={handleModeChange}
        onReload={load}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
