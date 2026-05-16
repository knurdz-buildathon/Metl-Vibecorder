"use client";

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import Sidebar from "../layout/sidebar";
import Topbar from "../layout/topbar";
import ProviderStatusBar from "../layout/provider-status-bar";
import EditorPanel from "./editor-panel";
import BottomPanel from "./bottom-panel";
import ChatPanel from "../assistant/chat-panel";
import ActionButtonsPanel from "../assistant/action-buttons-panel";
import AgentStatusCard from "../assistant/agent-status-card";
import ModeSelector from "../assistant/mode-selector";
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
} from "@/types";

export interface CloudIdeLayoutProps {
  title?: string;
  projectName?: string;
  branchName?: string;
  ideUrl?: string;
  previewUrl?: string;
  ideStatus?: IdeStatus;
  previewStatus?: PreviewStatus;
  mode: SessionMode;
  status: SessionStatus;
  messages: ChatMessage[];
  checks: CheckRun[];
  fileChanges?: FileChange[];
  logs: string[];
  testRuns?: TestRunPayload[];
  restorePoints?: RestorePointPayload[];
  agentRuns?: AgentRunPayload[];
  approvals?: ApprovalPayload[];
  activeModel?: string;
  activePromptVersion?: string;
  onSendMessage?: (message: string) => void;
  onModeChange?: (mode: SessionMode) => void;
  onReload?: () => void;
  onOpenSettings?: () => void;
}

const busyStatuses: SessionStatus[] = [
  "workspace_creating",
  "repo_cloning",
  "repo_analyzing",
  "planning",
  "implementing",
  "testing",
  "fixing",
  "repairing",
];

export default function CloudIdeLayout({
  title,
  projectName,
  branchName,
  ideUrl,
  previewUrl,
  ideStatus,
  previewStatus,
  mode,
  status,
  messages,
  checks,
  fileChanges = [],
  logs,
  testRuns = [],
  restorePoints = [],
  agentRuns = [],
  approvals = [],
  activeModel,
  activePromptVersion,
  onSendMessage,
  onModeChange,
  onReload,
  onOpenSettings,
}: CloudIdeLayoutProps) {
  const isBusy = busyStatuses.includes(status);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Fixed left sidebar */}
      <Sidebar />

      {/* Resizable main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar
          title={title}
          projectName={projectName}
          branchName={branchName}
          mode={mode}
          status={status}
          onModeChange={onModeChange}
          onOpenSettings={onOpenSettings}
        />

        {/* Main resizable panel group */}
        <PanelGroup direction="horizontal" className="flex-1 min-h-0">
          {/* Activity bar strip */}
          <Panel defaultSize={4} minSize={3} maxSize={8} className="hidden md:flex flex-col bg-card border-r border-border">
            <ActivityBar />
          </Panel>

          <PanelResizeHandle className="w-0.5 bg-border hover:bg-ring transition-colors hidden md:block" />

          {/* Center: editor + bottom */}
          <Panel defaultSize={65} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={20}>
                <EditorPanel
                  ideUrl={ideUrl}
                  ideStatus={ideStatus}
                  previewUrl={previewUrl}
                  previewStatus={previewStatus}
                />
              </Panel>

              <PanelResizeHandle className="h-0.5 bg-border hover:bg-ring transition-colors" />

              <Panel defaultSize={30} minSize={10} maxSize={50}>
                <BottomPanel
                  checks={checks}
                  logs={logs}
                  testRuns={testRuns}
                  agentRuns={agentRuns}
                />
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-0.5 bg-border hover:bg-ring transition-colors" />

          {/* Right assistant panel */}
          <Panel defaultSize={25} minSize={18} maxSize={40}>
            <div className="flex flex-col h-full bg-card border-l border-border">
              <div className="p-3 space-y-3 border-b border-border">
                <ModeSelector
                  value={mode}
                  onChange={onModeChange || (() => {})}
                  disabled={isBusy}
                />
                <AgentStatusCard
                  mode={mode}
                  status={status}
                  activeModel={activeModel}
                  activePromptVersion={activePromptVersion}
                />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ActionButtonsPanel
                  status={status}
                  sessionId={messages[0]?.sessionId || ""}
                  approvals={approvals}
                  onReload={onReload}
                />
                <ChatPanel
                  messages={messages}
                  onSend={onSendMessage}
                  disabled={isBusy}
                  mode={mode}
                  approvals={approvals}
                  onModeChange={onModeChange}
                />
              </div>
            </div>
          </Panel>
        </PanelGroup>

        <ProviderStatusBar />
      </div>
    </div>
  );
}

function ActivityBar() {
  const items = [
    { icon: <span className="text-xs font-bold">Ex</span>, label: "Explorer" },
    { icon: <span className="text-xs font-bold">Gt</span>, label: "Git" },
    { icon: <span className="text-xs font-bold">T</span>, label: "Tests" },
    { icon: <span className="text-xs font-bold">Rp</span>, label: "Restore" },
    { icon: <span className="text-xs font-bold">R</span>, label: "Reports" },
  ];
  return (
    <div className="flex flex-col items-center py-2 gap-3">
      {items.map((item) => (
        <button
          key={item.label}
          title={item.label}
          className="w-8 h-8 flex items-center justify-center rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
