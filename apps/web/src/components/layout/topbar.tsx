"use client";

import {
  Loader2,
  Play,
  ShieldCheck,
  Rocket,
  Settings,
  Wifi,
  WifiOff,
  GitBranch,
} from "lucide-react";
import type { SessionMode, SessionStatus } from "@/types";

interface TopbarProps {
  title?: string;
  projectName?: string;
  branchName?: string;
  mode: SessionMode;
  status?: SessionStatus;
  onModeChange?: (mode: SessionMode) => void;
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

const statusColor: Record<string, string> = {
  completed: "text-emerald-400",
  failed: "text-red-400",
  paused: "text-amber-400",
  awaiting_plan_approval: "text-amber-400",
  awaiting_commit_approval: "text-amber-400",
};

export default function Topbar({
  title,
  projectName,
  branchName,
  mode,
  status,
  onModeChange,
  onOpenSettings,
}: TopbarProps) {
  const busy = status ? busyStatuses.includes(status) : false;

  return (
    <div className="h-9 flex items-center justify-between px-3 bg-card border-b border-border shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-medium truncate max-w-[140px]">
          {projectName || title || "Untitled"}
        </span>
        {branchName && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
            <GitBranch size={10} />
            {branchName}
          </span>
        )}
        {status && (
          <span
            className={`text-[10px] capitalize ${
              statusColor[status] || "text-muted-foreground"
            }`}
          >
            {status.replace(/_/g, " ")}
          </span>
        )}
        {busy && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400">
            <Loader2 size={10} className="animate-spin" />
            {status?.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Center - Mode */}
      <div className="hidden md:flex items-center gap-1 p-0.5 bg-secondary rounded-md border border-border">
        {(["AGENT", "PLAN", "ASK"] as SessionMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange?.(m)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground bg-secondary px-2 py-1 rounded transition-colors">
          <Play size={10} />
          Run
        </button>
        <button className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground bg-secondary px-2 py-1 rounded transition-colors">
          <ShieldCheck size={10} />
          Verify
        </button>
        <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground bg-secondary px-2 py-1 rounded transition-colors">
          <Rocket size={10} />
          <span className="hidden sm:inline">Deploy</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          title="Settings"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}
