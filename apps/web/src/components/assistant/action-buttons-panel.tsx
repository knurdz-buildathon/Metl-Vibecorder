"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, FileText, StopCircle } from "lucide-react";
import type { SessionStatus } from "@/types";
import { approveRequest, rejectRequest, cancelSession } from "@/lib/api";

interface ActionButtonsPanelProps {
  status: SessionStatus;
  sessionId: string;
  onReload?: () => void;
}

export default function ActionButtonsPanel({ status, sessionId, onReload }: ActionButtonsPanelProps) {
  if (status === "awaiting_plan_approval") {
    return (
      <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 my-2">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <FileText size={14} />
          <span className="text-xs font-semibold uppercase">Plan Approval Required</span>
        </div>
        <div className="flex gap-2">
          <ApproveButton sessionId={sessionId} onReload={onReload} />
          <RejectButton sessionId={sessionId} onReload={onReload} />
        </div>
      </div>
    );
  }

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
    <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
      {isBusy && (
        <CancelButton sessionId={sessionId} onReload={onReload} />
      )}
      <button
        onClick={onReload}
        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
        title="Reload session"
      >
        <RefreshCw size={12} />
        Refresh
      </button>
    </div>
  );
}

function CancelButton({ sessionId, onReload }: { sessionId: string; onReload?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!confirm("Cancel this session?")) return;
    setLoading(true);
    try {
      await cancelSession(sessionId);
      onReload?.();
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50"
    >
      <StopCircle size={12} />
      Cancel
    </button>
  );
}

function ApproveButton({ sessionId, onReload }: { sessionId: string; onReload?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (!res.ok || !data.session) {
        throw new Error(data.error || "Session not found");
      }
      const pending = data.session?.approvalRequests?.find((a: any) => a.approved === null);
      if (!pending) {
        throw new Error("No pending approval found");
      }
      const result = await approveRequest(sessionId, pending.id);
      if (!result.approved) {
        throw new Error(result.error || "Approval failed");
      }
      setDone(true);
      onReload?.();
    } catch (e: any) {
      setError(e.message || "Approval failed");
      setDone(false);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col gap-1 flex-1">
        <button
          onClick={handleClick}
          disabled={loading}
          className="rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 text-xs font-medium hover:bg-emerald-900/60 transition-colors disabled:opacity-50"
        >
          <CheckCircle size={12} className="inline mr-1" />
          Approve
        </button>
        <span className="text-[10px] text-red-400">{error}</span>
      </div>
    );
  }

  if (done) {
    return (
      <span className="flex-1 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 text-xs font-medium text-center">
        Approved
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex-1 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 text-xs font-medium hover:bg-emerald-900/60 transition-colors disabled:opacity-50"
    >
      <CheckCircle size={12} className="inline mr-1" />
      {loading ? "Approving..." : "Approve"}
    </button>
  );
}

function RejectButton({ sessionId, onReload }: { sessionId: string; onReload?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (!res.ok || !data.session) {
        throw new Error(data.error || "Session not found");
      }
      const pending = data.session?.approvalRequests?.find((a: any) => a.approved === null);
      if (!pending) {
        throw new Error("No pending approval found");
      }
      const result = await rejectRequest(sessionId, pending.id);
      if (!result.rejected) {
        throw new Error(result.error || "Rejection failed");
      }
      setDone(true);
      onReload?.();
    } catch (e: any) {
      setError(e.message || "Rejection failed");
      setDone(false);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col gap-1 flex-1">
        <button
          onClick={handleClick}
          disabled={loading}
          className="rounded bg-red-900/40 text-red-300 border border-red-800/50 px-3 py-1.5 text-xs font-medium hover:bg-red-900/60 transition-colors disabled:opacity-50"
        >
          <XCircle size={12} className="inline mr-1" />
          Reject
        </button>
        <span className="text-[10px] text-red-400">{error}</span>
      </div>
    );
  }

  if (done) {
    return (
      <span className="flex-1 rounded bg-red-900/40 text-red-300 border border-red-800/50 px-3 py-1.5 text-xs font-medium text-center">
        Rejected
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex-1 rounded bg-red-900/40 text-red-300 border border-red-800/50 px-3 py-1.5 text-xs font-medium hover:bg-red-900/60 transition-colors disabled:opacity-50"
    >
      <XCircle size={12} className="inline mr-1" />
      {loading ? "Rejecting..." : "Reject"}
    </button>
  );
}
