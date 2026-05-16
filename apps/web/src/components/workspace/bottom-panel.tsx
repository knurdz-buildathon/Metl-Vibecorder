"use client";

import { Terminal, CheckCircle2, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CheckRun } from "@/types";

interface BottomPanelProps {
  checks: CheckRun[];
  logs: string[];
}

export default function BottomPanel({ checks, logs }: BottomPanelProps) {
  const [tab, setTab] = useState<"checks" | "logs">("checks");
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div
        className="flex items-center justify-between h-8 px-4 bg-zinc-900 border-t border-zinc-800 cursor-pointer"
        onClick={() => setCollapsed(false)}
      >
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Terminal size={12} />
            Logs
          </span>
          <span>{checks.length} checks</span>
        </div>
        <ChevronUp size={14} className="text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-48 bg-zinc-950 border-t border-zinc-800">
      <div className="flex items-center justify-between h-8 px-4 border-b border-zinc-800">
        <div className="flex gap-4">
          <button
            onClick={() => setTab("checks")}
            className={`text-xs ${
              tab === "checks"
                ? "text-white border-b border-white"
                : "text-zinc-500 hover:text-zinc-300"
            } pb-2`}
          >
            Checks ({checks.length})
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`text-xs ${
              tab === "logs"
                ? "text-white border-b border-white"
                : "text-zinc-500 hover:text-zinc-300"
            } pb-2`}
          >
            Logs ({logs.length})
          </button>
        </div>
        <ChevronDown
          size={14}
          className="text-zinc-500 cursor-pointer"
          onClick={() => setCollapsed(true)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "checks" && (
          <div className="space-y-2">
            {checks.length === 0 && (
              <div className="text-xs text-zinc-600 text-center py-4">
                No checks run yet.
              </div>
            )}
            {checks.map((check) => (
              <div
                key={check.id}
                className="flex items-center gap-2 text-xs"
              >
                {check.status === "passed" ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : check.status === "failed" ? (
                  <XCircle size={14} className="text-red-400" />
                ) : (
                  <Terminal size={14} className="text-zinc-500 animate-pulse" />
                )}
                <span className="text-zinc-300">{check.type}</span>
                <span className="text-zinc-500">{check.command}</span>
                {check.status === "failed" && check.stderr && (
                  <span className="text-red-400 ml-auto truncate max-w-[200px]">
                    {check.stderr}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {tab === "logs" && (
          <div className="font-mono text-xs space-y-1">
            {logs.length === 0 && (
              <div className="text-zinc-600 text-center py-4">No logs yet.</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="text-zinc-400">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
