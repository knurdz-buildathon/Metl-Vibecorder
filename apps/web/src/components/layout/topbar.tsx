"use client";

import { Wifi, WifiOff, Loader2 } from "lucide-react";
import type { SessionStatus } from "@/types";

interface TopbarProps {
  title?: string;
  workspaceConnected?: boolean;
  status?: SessionStatus;
}

export default function Topbar({ title, workspaceConnected, status }: TopbarProps) {
  const busy = [
    "workspace_creating",
    "repo_cloning",
    "repo_analyzing",
    "planning",
    "implementing",
    "testing",
    "fixing",
    "repairing",
  ].includes(status || "");

  const statusColor: Record<string, string> = {
    completed: "text-emerald-400",
    failed: "text-red-400",
    paused: "text-amber-400",
    awaiting_plan_approval: "text-amber-400",
  };

  return (
    <div className="h-9 flex items-center justify-between px-4 bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center gap-3 min-w-0">
        {title && (
          <span className="text-xs font-mono text-zinc-300 truncate">{title}</span>
        )}
        {busy && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400">
            <Loader2 size={10} className="animate-spin" />
            {status?.replace(/_/g, " ")}
          </span>
        )}
        {status && !busy && status !== "created" && (
          <span className={`text-[10px] capitalize ${statusColor[status] || "text-zinc-500"}`}>
            {status.replace(/_/g, " ")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <WorkspaceIndicator connected={workspaceConnected} />
      </div>
    </div>
  );
}

function WorkspaceIndicator({ connected }: { connected?: boolean }) {
  if (connected === undefined) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
        <Wifi size={10} />
        Workspace
      </span>
    );
  }
  return connected ? (
    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
      <Wifi size={10} />
      Workspace
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
      <WifiOff size={10} />
      Workspace
    </span>
  );
}
