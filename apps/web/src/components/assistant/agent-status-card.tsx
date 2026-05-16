"use client";

import { Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";
import type { SessionStatus } from "@/types";

interface AgentStatusCardProps {
  status: SessionStatus;
  mode: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  created: <Circle size={14} />,
  workspace_creating: <Loader2 size={14} className="animate-spin" />,
  repo_cloning: <Loader2 size={14} className="animate-spin" />,
  repo_analyzing: <Loader2 size={14} className="animate-spin" />,
  planning: <Loader2 size={14} className="animate-spin" />,
  implementing: <Loader2 size={14} className="animate-spin" />,
  testing: <Loader2 size={14} className="animate-spin" />,
  fixing: <Loader2 size={14} className="animate-spin" />,
  awaiting_plan_approval: <Circle size={14} />,
  completed: <CheckCircle2 size={14} className="text-emerald-400" />,
  failed: <XCircle size={14} className="text-red-400" />,
};

export default function AgentStatusCard({ status, mode }: AgentStatusCardProps) {
  const icon = statusIcons[status] || <Circle size={14} />;
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
    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-400 uppercase">
          Agent
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isBusy
              ? "bg-amber-900/50 text-amber-400"
              : status === "completed"
              ? "bg-emerald-900/50 text-emerald-400"
              : status === "failed"
              ? "bg-red-900/50 text-red-400"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {mode.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-white">
        {icon}
        <span className="capitalize">{status.replace(/_/g, " ")}</span>
      </div>
    </div>
  );
}
