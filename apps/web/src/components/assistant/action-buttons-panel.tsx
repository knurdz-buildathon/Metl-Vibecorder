"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, FileText } from "lucide-react";
import type { SessionMode, SessionStatus, ChatMessage, CheckRun, FileChange } from "@/types";
import { approveRequest, rejectRequest } from "@/lib/api";

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

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
      <span className="text-xs text-zinc-500">Actions:</span>
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

function ApproveButton({ sessionId, onReload }: { sessionId: string; onReload?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Fetch pending approval for this session
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      const pending = data.session?.approvals?.find((a: any) => a.approved === null);
      if (pending) {
        await approveRequest(sessionId, pending.id);
      }
      setDone(true);
      onReload?.();
    } catch (e) {
      setDone(false);
    } finally {
      setLoading(false);
    }
  };

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
      Approve
    </button>
  );
}

function RejectButton({ sessionId, onReload }: { sessionId: string; onReload?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      const pending = data.session?.approvals?.find((a: any) => a.approved === null);
      if (pending) {
        await rejectRequest(sessionId, pending.id);
      }
      setDone(true);
      onReload?.();
    } catch (e) {
      setDone(false);
    } finally {
      setLoading(false);
    }
  };

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
      Reject
    </button>
  );
}
