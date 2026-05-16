"use client";

import { useState } from "react";
import Sidebar from "../layout/sidebar";
import Topbar from "../layout/topbar";
import ProviderStatusBar from "../layout/provider-status-bar";
import EditorPanel from "./editor-panel";
import ChatPanel from "../assistant/chat-panel";
import ActionButtonsPanel from "../assistant/action-buttons-panel";
import BottomPanel from "./bottom-panel";
import AgentStatusCard from "../assistant/agent-status-card";
import ModeSelector from "../assistant/mode-selector";
import type { SessionMode, SessionStatus, ChatMessage, CheckRun, FileChange } from "@/types";

interface CloudIdeLayoutProps {
  title?: string;
  workspaceUrl?: string;
  mode: SessionMode;
  status: SessionStatus;
  messages: ChatMessage[];
  checks: CheckRun[];
  fileChanges?: FileChange[];
  logs: string[];
  onSendMessage?: (message: string) => void;
  onModeChange?: (mode: SessionMode) => void;
  onReload?: () => void;
}

export default function CloudIdeLayout({
  title,
  workspaceUrl,
  mode,
  status,
  messages,
  checks,
  fileChanges = [],
  logs,
  onSendMessage,
  onModeChange,
  onReload,
}: CloudIdeLayoutProps) {
  const [rightTab, setRightTab] = useState<"chat" | "files">("chat");
  const isBusy = [
    "workspace_creating",
    "repo_cloning",
    "repo_analyzing",
    "planning",
    "implementing",
    "testing",
    "fixing",
    "repairing",
  ].includes(status);

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title={title} />

        <div className="flex flex-1 min-h-0">
          {/* Main editor area */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 min-h-0">
              <EditorPanel workspaceUrl={workspaceUrl} />
            </div>
            <BottomPanel checks={checks} logs={logs} />
          </div>

          {/* Right panel: chat + file changes */}
          <div className="w-80 flex flex-col border-l border-zinc-800">
            <div className="p-3 space-y-3 border-b border-zinc-800">
              <ModeSelector
                value={mode}
                onChange={onModeChange || (() => {})}
                disabled={isBusy}
              />
              <AgentStatusCard mode={mode} status={status} />

              {/* Tabs */}
              <div className="flex gap-1 border-b border-zinc-800 pb-2">
                <button
                  onClick={() => setRightTab("chat")}
                  className={`text-xs px-2 py-1 rounded ${
                    rightTab === "chat" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Chat ({messages.length})
                </button>
                <button
                  onClick={() => setRightTab("files")}
                  className={`text-xs px-2 py-1 rounded ${
                    rightTab === "files" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Files ({fileChanges.length})
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {rightTab === "chat" ? (
                <>
                  <ActionButtonsPanel
                    status={status}
                    sessionId={messages[0]?.sessionId || ""}
                    onReload={onReload}
                  />
                  <ChatPanel
                    messages={messages}
                    onSend={onSendMessage}
                    disabled={isBusy}
                  />
                </>
              ) : (
                <FileChangesPanel changes={fileChanges} />
              )}
            </div>
          </div>
        </div>

        <ProviderStatusBar />
      </div>
    </div>
  );
}

function FileChangesPanel({ changes }: { changes: FileChange[] }) {
  const operationColors: Record<string, string> = {
    created: "text-emerald-400",
    modified: "text-amber-400",
    deleted: "text-red-400",
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {changes.length === 0 && (
        <div className="text-zinc-500 text-sm text-center py-8">
          No file changes yet.
        </div>
      )}
      {changes.map((c) => (
        <div
          key={c.id}
          className="px-3 py-2 border-b border-zinc-800 text-xs hover:bg-zinc-900"
        >
          <div className="flex items-center gap-2">
            <span className={`font-medium ${operationColors[c.operation] || "text-zinc-300"}`}>
              {c.operation}
            </span>
            <span className="text-zinc-400 truncate">{c.filePath}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
