"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, SkipForward, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";

interface VerificationStage {
  name: string;
  status: "running" | "passed" | "failed" | "skipped" | "pending";
  durationMs?: number;
  summary?: string;
  error?: string;
}

const defaultStages: VerificationStage[] = [
  { name: "Workspace", status: "pending" },
  { name: "Files", status: "pending" },
  { name: "Git Status", status: "pending" },
  { name: "Internal Docs", status: "pending" },
  { name: "Install", status: "pending" },
  { name: "Lint", status: "pending" },
  { name: "Typecheck", status: "pending" },
  { name: "Unit Tests", status: "pending" },
  { name: "Build", status: "pending" },
  { name: "Preview", status: "pending" },
  { name: "Playwright", status: "pending" },
  { name: "Gemini Review", status: "pending" },
  { name: "Final Summary", status: "pending" },
];

function useVerification() {
  const [stages, setStages] = useState<VerificationStage[]>(defaultStages);

  const retryStage = (name: string) => {
    setStages((prev) =>
      prev.map((s) => (s.name === name ? { ...s, status: "running" as const } : s))
    );
  };

  return { stages, retryStage };
}

export default function VerificationPanel() {
  const { stages, retryStage } = useVerification();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const counts = {
    passed: stages.filter((s) => s.status === "passed").length,
    failed: stages.filter((s) => s.status === "failed").length,
    running: stages.filter((s) => s.status === "running").length,
    skipped: stages.filter((s) => s.status === "skipped").length,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 px-1">
        <span>{stages.length} stages</span>
        {counts.passed > 0 && <span className="text-emerald-400">{counts.passed} passed</span>}
        {counts.failed > 0 && <span className="text-red-400">{counts.failed} failed</span>}
        {counts.running > 0 && <span className="text-amber-400">{counts.running} running</span>}
        {counts.skipped > 0 && <span>{counts.skipped} skipped</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {stages.map((stage) => (
          <StageCard
            key={stage.name}
            stage={stage}
            expanded={expanded.has(stage.name)}
            onToggle={() => toggle(stage.name)}
            onRetry={() => retryStage(stage.name)}
          />
        ))}
      </div>
    </div>
  );
}

function StageCard({
  stage,
  expanded,
  onToggle,
  onRetry,
}: {
  stage: VerificationStage;
  expanded: boolean;
  onToggle: () => void;
  onRetry: () => void;
}) {
  const icon = () => {
    switch (stage.status) {
      case "passed":
        return <CheckCircle2 size={12} className="text-emerald-400" />;
      case "failed":
        return <XCircle size={12} className="text-red-400" />;
      case "running":
        return <Loader2 size={12} className="text-amber-400 animate-spin" />;
      case "skipped":
        return <SkipForward size={12} className="text-muted-foreground/40" />;
      default:
        return <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />;
    }
  };

  return (
    <div className="rounded border border-border bg-secondary/20 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon()}
          <span className="text-[10px] font-medium text-foreground">{stage.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {stage.durationMs !== undefined && (
            <span className="text-[9px] text-muted-foreground/60">{(stage.durationMs / 1000).toFixed(1)}s</span>
          )}
          {expanded ? <ChevronDown size={10} className="text-muted-foreground" /> : <ChevronRight size={10} className="text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-2 pb-2 space-y-1">
          {stage.summary && <p className="text-[9px] text-muted-foreground">{stage.summary}</p>}
          {stage.error && <p className="text-[9px] text-red-400">{stage.error}</p>}
          {stage.status === "failed" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={8} />
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
