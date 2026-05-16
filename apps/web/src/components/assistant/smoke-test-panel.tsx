"use client";

import { useState } from "react";
import { Play, CheckCircle2, XCircle } from "lucide-react";
import type { CheckRun } from "@/types";

interface SmokeTestPanelProps {
  sessionId: string;
  onResult?: (result: CheckRun) => void;
}

export default function SmokeTestPanel({ sessionId, onResult }: SmokeTestPanelProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ status: string; output: string } | null>(null);

  const runSmokeTest = async () => {
    if (!sessionId || running) return;
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch(`/api/smoke-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();

      setResult({
        status: data.result?.status || "unknown",
        output: data.result?.stdout || data.error || "No output",
      });

      if (onResult) {
        onResult({
          id: `smoke-${Date.now()}`,
          sessionId,
          type: "playwright",
          status: data.result?.status || "failed",
          command: "npx playwright test",
          stdout: data.result?.stdout,
          stderr: data.result?.stderr,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      setResult({ status: "failed", output: e.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          Smoke Test
        </span>
        <button
          onClick={runSmokeTest}
          disabled={running}
          className="flex items-center gap-1 rounded bg-zinc-800 text-white px-2 py-1 text-[10px] hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {running ? (
            <span className="animate-spin w-3 h-3 border border-zinc-500 border-t-white rounded-full inline-block" />
          ) : (
            <Play size={10} />
          )}
          {running ? "Running..." : "Run"}
        </button>
      </div>

      {result && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {result.status === "passed" ? (
              <CheckCircle2 size={12} className="text-emerald-400" />
            ) : (
              <XCircle size={12} className="text-red-400" />
            )}
            <span className={`text-xs font-medium ${result.status === "passed" ? "text-emerald-400" : "text-red-400"}`}>
              {result.status.toUpperCase()}
            </span>
          </div>
          <pre className="text-[10px] text-zinc-400 bg-zinc-900 rounded p-2 max-h-24 overflow-y-auto whitespace-pre-wrap">
            {result.output}
          </pre>
        </div>
      )}
    </div>
  );
}
