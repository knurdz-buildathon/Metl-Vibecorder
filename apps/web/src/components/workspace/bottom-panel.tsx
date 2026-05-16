"use client";

import { useState } from "react";
import { Terminal, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { CheckRun } from "@/types";

interface BottomPanelProps {
  checks: CheckRun[];
  logs: string[];
}

export default function BottomPanel({ checks, logs }: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<"checks" | "logs">("checks");

  const statusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 size={12} className="text-emerald-400" />;
      case "failed":
        return <XCircle size={12} className="text-red-400" />;
      case "running":
        return <Loader2 size={12} className="text-amber-400 animate-spin" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-zinc-700" />;
    }
  };

  return (
    <div className="h-48 flex flex-col border-t border-zinc-800 bg-zinc-950">
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("checks")}
          className={`px-3 py-1.5 text-xs font-medium ${
            activeTab === "checks"
              ? "text-white border-b border-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Checks ({checks.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-3 py-1.5 text-xs font-medium ${
            activeTab === "logs"
              ? "text-white border-b border-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Logs ({logs.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {activeTab === "checks" ? (
          checks.length === 0 ? (
            <div className="text-zinc-600 text-center py-4">
              No checks run yet.
            </div>
          ) : (
            <div className="space-y-1">
              {checks.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-900"
                >
                  {statusIcon(c.status)}
                  <span className="text-zinc-300 w-20">{c.type}</span>
                  <span className="text-zinc-500 text-[10px]">{c.command}</span>
                  {c.status === "failed" && c.stderr && (
                    <span className="text-red-400 text-[10px] truncate flex-1">{c.stderr}</span>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-0.5">
            {logs.map((l, i) => (
              <div key={i} className="text-zinc-400 whitespace-pre-wrap">
                {l}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
