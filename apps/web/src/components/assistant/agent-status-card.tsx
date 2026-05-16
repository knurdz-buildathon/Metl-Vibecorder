"use client";

import { Loader2, CheckCircle2, XCircle, Circle, Cpu, Wrench, FileCode } from "lucide-react";
import type { SessionStatus, SessionMode } from "@/types";

interface AgentStatusCardProps {
  status: SessionStatus;
  mode: SessionMode;
  activeModel?: string;
  activePromptVersion?: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  created: <Circle size={12} />,
  workspace_creating: <Loader2 size={12} className="animate-spin text-amber-400" />,
  repo_cloning: <Loader2 size={12} className="animate-spin text-amber-400" />,
  repo_analyzing: <Loader2 size={12} className="animate-spin text-amber-400" />,
  planning: <Loader2 size={12} className="animate-spin text-amber-400" />,
  implementing: <Loader2 size={12} className="animate-spin text-amber-400" />,
  testing: <Loader2 size={12} className="animate-spin text-amber-400" />,
  fixing: <Loader2 size={12} className="animate-spin text-amber-400" />,
  repairing: <Loader2 size={12} className="animate-spin text-amber-400" />,
  awaiting_plan_approval: <Circle size={12} className="text-amber-400" />,
  awaiting_commit_approval: <Circle size={12} className="text-amber-400" />,
  completed: <CheckCircle2 size={12} className="text-emerald-400" />,
  failed: <XCircle size={12} className="text-red-400" />,
};

export default function AgentStatusCard({ status, mode, activeModel, activePromptVersion }: AgentStatusCardProps) {
  const icon = statusIcons[status] || <Circle size={12} />;
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

  const badgeColor = isBusy
    ? "bg-amber-950/50 text-amber-400 border-amber-900/50"
    : status === "completed"
    ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/50"
    : status === "failed"
    ? "bg-red-950/50 text-red-400 border-red-900/50"
    : "bg-secondary text-muted-foreground border-border";

  return (
    <div className="rounded-md border border-border bg-secondary/40 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Cpu size={10} />
          MetlCode VibeCoder
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badgeColor}`}>
          {mode}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-foreground">
        {icon}
        <span className="capitalize">{status.replace(/_/g, " ")}</span>
      </div>

      {/* Model info */}
      {activeModel && (
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <span className="text-muted-foreground/50">Model:</span>
          <span className="text-foreground truncate">{activeModel}</span>
        </div>
      )}

      {/* Prompt version */}
      {activePromptVersion && (
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <FileCode size={8} />
          <span>Super prompt v{activePromptVersion}</span>
        </div>
      )}

      {/* Repair mode label */}
      {status === "repairing" || status === "fixing" ? (
        <div className="flex items-center gap-1.5 text-[9px] text-amber-400">
          <Wrench size={8} />
          <span>VibeCoder repair mode</span>
        </div>
      ) : null}
    </div>
  );
}
