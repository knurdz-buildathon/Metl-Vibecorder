"use client";

import { useState } from "react";
import { Terminal, CheckCircle2, XCircle, Loader2, Bug, Activity, FlaskConical } from "lucide-react";
import type { CheckRun, TestRunPayload, AgentRunPayload } from "@/types";
import VerificationPanel from "./verification-panel";

interface BottomPanelProps {
  checks: CheckRun[];
  logs: string[];
  testRuns?: TestRunPayload[];
  agentRuns?: AgentRunPayload[];
}

type BottomTab = "terminal" | "build_logs" | "tests" | "verification" | "problems" | "agent_runs";

export default function BottomPanel({ checks, logs, testRuns = [], agentRuns = [] }: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("terminal");

  const failedChecks = checks.filter((c) => c.status === "failed");

  const statusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />;
      case "failed":
        return <XCircle size={10} className="text-red-400 shrink-0" />;
      case "running":
        return <Loader2 size={10} className="text-amber-400 animate-spin shrink-0" />;
      default:
        return <div className="w-2.5 h-2.5 rounded-full bg-muted shrink-0" />;
    }
  };

  const tabs: { key: BottomTab; label: string; count?: number }[] = [
    { key: "terminal", label: "Terminal" },
    { key: "build_logs", label: "Build Logs", count: logs.length },
    { key: "tests", label: "Tests", count: testRuns.length || checks.length },
    { key: "verification", label: "Verification" },
    { key: "problems", label: "Problems", count: failedChecks.length || undefined },
    { key: "agent_runs", label: "Agent Runs", count: agentRuns.length },
  ];

  return (
    <div className="h-full flex flex-col bg-card border-t border-border">
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-[10px] font-medium whitespace-nowrap transition-colors ${
              activeTab === t.key
                ? "text-foreground border-b border-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1 text-muted-foreground/60">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px]">
        {activeTab === "terminal" && (
          <div className="space-y-0.5">
            {logs.length === 0 ? (
              <div className="text-muted-foreground/40 text-center py-4">Terminal ready. Waiting for output...</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="text-muted-foreground whitespace-pre-wrap">
                  {l}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "build_logs" && (
          <div className="space-y-0.5">
            {logs.length === 0 ? (
              <div className="text-muted-foreground/40 text-center py-4">No build logs yet.</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="text-muted-foreground whitespace-pre-wrap">
                  {l}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "tests" && (
          <TestsTab checks={checks} testRuns={testRuns} statusIcon={statusIcon} />
        )}

        {activeTab === "verification" && <VerificationPanel />}

        {activeTab === "problems" && (
          <ProblemsTab failedChecks={failedChecks} statusIcon={statusIcon} />
        )}

        {activeTab === "agent_runs" && <AgentRunsTab agentRuns={agentRuns} />}
      </div>
    </div>
  );
}

function TestsTab({
  checks,
  testRuns,
  statusIcon,
}: {
  checks: CheckRun[];
  testRuns: TestRunPayload[];
  statusIcon: (s: string) => React.ReactNode;
}) {
  if (testRuns.length === 0 && checks.length === 0) {
    return <div className="text-muted-foreground/40 text-center py-4">No tests run yet.</div>;
  }
  return (
    <div className="space-y-1">
      {testRuns.map((t) => (
        <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary/30">
          {statusIcon(t.status)}
          <span className="text-foreground w-24 truncate">{t.name}</span>
          <span className="text-muted-foreground/60">
            {t.durationMs ? `${(t.durationMs / 1000).toFixed(1)}s` : "-"}
          </span>
          {t.error && <span className="text-red-400 truncate flex-1">{t.error}</span>}
        </div>
      ))}
      {checks.map((c) => (
        <div key={c.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary/30">
          {statusIcon(c.status)}
          <span className="text-foreground w-24">{c.type}</span>
          <span className="text-muted-foreground/60 truncate">{c.command}</span>
          {c.status === "failed" && c.stderr && (
            <span className="text-red-400 truncate flex-1">{c.stderr}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ProblemsTab({
  failedChecks,
  statusIcon,
}: {
  failedChecks: CheckRun[];
  statusIcon: (s: string) => React.ReactNode;
}) {
  if (failedChecks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/40 gap-1">
        <Bug size={16} />
        <span>No problems found.</span>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {failedChecks.map((c) => (
        <div key={c.id} className="flex items-start gap-2 px-2 py-1 rounded bg-destructive/5">
          {statusIcon(c.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium">{c.type}</span>
              <span className="text-muted-foreground/60 truncate">{c.command}</span>
            </div>
            {c.stderr && <div className="text-red-400 mt-0.5 whitespace-pre-wrap">{c.stderr}</div>}
            {c.error && <div className="text-red-400 mt-0.5">{c.error}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentRunsTab({ agentRuns }: { agentRuns: AgentRunPayload[] }) {
  if (agentRuns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/40 gap-1">
        <Activity size={16} />
        <span>No agent runs yet.</span>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {agentRuns.map((a) => (
        <div key={a.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary/30">
          {a.succeeded ? (
            <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
          ) : (
            <XCircle size={10} className="text-red-400 shrink-0" />
          )}
          <span className="text-foreground w-16">{a.mode}</span>
          <span className="text-muted-foreground w-24">{a.model}</span>
          <span className="text-muted-foreground/60">
            {a.latencyMs ? `${(a.latencyMs / 1000).toFixed(1)}s` : "-"}
          </span>
        </div>
      ))}
    </div>
  );
}
