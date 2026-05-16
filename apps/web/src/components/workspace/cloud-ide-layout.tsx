"use client";

import Sidebar from "../layout/sidebar";
import Topbar from "../layout/topbar";
import ProviderStatusBar from "../layout/provider-status-bar";
import EditorPanel from "./editor-panel";
import ChatPanel from "../assistant/chat-panel";
import BottomPanel from "./bottom-panel";
import AgentStatusCard from "../assistant/agent-status-card";
import ModeSelector from "../assistant/mode-selector";
import type { SessionMode, SessionStatus, ChatMessage, CheckRun } from "@/types";

interface CloudIdeLayoutProps {
  title?: string;
  workspaceUrl?: string;
  mode: SessionMode;
  status: SessionStatus;
  messages: ChatMessage[];
  checks: CheckRun[];
  logs: string[];
  onSendMessage?: (message: string) => void;
  onModeChange?: (mode: SessionMode) => void;
}

export default function CloudIdeLayout({
  title,
  workspaceUrl,
  mode,
  status,
  messages,
  checks,
  logs,
  onSendMessage,
  onModeChange,
}: CloudIdeLayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title={title} />

        <div className="flex flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 min-h-0">
              <EditorPanel workspaceUrl={workspaceUrl} />
            </div>
            <BottomPanel checks={checks} logs={logs} />
          </div>

          <div className="w-80 flex flex-col border-l border-zinc-800">
            <div className="p-3 space-y-3 border-b border-zinc-800">
              <ModeSelector
                value={mode}
                onChange={onModeChange || (() => {})}
                disabled={status === "implementing" || status === "testing"}
              />
              <AgentStatusCard mode={mode} status={status} />
            </div>
            <div className="flex-1 min-h-0">
              <ChatPanel
                messages={messages}
                onSend={onSendMessage}
                disabled={status === "implementing" || status === "testing"}
              />
            </div>
          </div>
        </div>

        <ProviderStatusBar />
      </div>
    </div>
  );
}
