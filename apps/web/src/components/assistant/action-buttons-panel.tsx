"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, FileText, StopCircle, HelpCircle, GitCommit } from "lucide-react";
import type { SessionStatus, ApprovalPayload } from "@/types";
import { approveRequest, rejectRequest, cancelSession } from "@/lib/api";

interface ActionButtonsPanelProps {
  status: SessionStatus;
  sessionId: string;
  approvals?: ApprovalPayload[];
  onReload?: () => void;
}

export default function ActionButtonsPanel({ status, sessionId, approvals = [], onReload }: ActionButtonsPanelProps) {
  const pendingPlan = approvals.find((a) => a.type === "plan" && a.status === "pending");
  const pendingCommit = approvals.find((a) => a.type === "commit" && a.status === "pending");

  if (pendingPlan) {
    return (
      <PlanApprovalGroup sessionId={sessionId} approval={pendingPlan} onReload={onReload} />
    );
  }

  if (pendingCommit) {
    return (
      <CommitApprovalGroup sessionId={sessionId} approval={pendingCommit} onReload={onReload} />
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
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
      {isBusy && <CancelButton sessionId={sessionId} onReload={onReload} />}
      <button
        onClick={onReload}
        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        title="Reload session"
      >
        <RefreshCw size={10} />
        Refresh
      </button>
      <button
        className="ml-auto text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        title="Help"
      >
        <HelpCircle size={10} />
        Help
      </button>
    </div>
  );
}

function PlanApprovalGroup({ sessionId, approval, onReload }: { sessionId: string; approval: ApprovalPayload; onReload?: () => void }) {
  return (
    <div className="rounded-md border border-amber-900/30 bg-amber-950/10 p-2.5 mx-2 my-1.5 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold uppercase">
        <FileText size={10} />
        Plan Approval Required
      </div>
      {approval.body && (
        <pre className="text-[9px] text-muted-foreground max-h-28 overflow-y-auto whitespace-pre-wrap font-mono bg-secondary/30 rounded p-1.5">
          {approval.body}
        </pre>
      )}
      <div className="flex gap-1.5">
        <ApproveButton sessionId={sessionId} approvalId={approval.id} onReload={onReload} />
        <RejectButton sessionId={sessionId} approvalId={approval.id} onReload={onReload} />
      </div>
    </div>
  );
}

function CommitApprovalGroup({ sessionId, approval, onReload }: { sessionId: string; approval: ApprovalPayload; onReload?: () => void }) {
  return (
    <div className="rounded-md border border-amber-900/30 bg-amber-950/10 p-2.5 mx-2 my-1.5 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold uppercase">
        <GitCommit size={10} />
        Commit Approval Required
      </div>
      {approval.body && (
        <pre className="text-[9px] text-muted-foreground max-h-20 overflow-y-auto whitespace-pre-wrap font-mono bg-secondary/30 rounded p-1.5">
          {approval.body}
        </pre>
      )}
      <div className="flex gap-1.5">
        <ApproveButton sessionId={sessionId} approvalId={approval.id} onReload={onReload} />
        <RejectButton sessionId={sessionId} approvalId={approval.id} onReload={onReload} />
      </div>
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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
    >
      <StopCircle size={10} />
      Cancel
    </button>
  );
}

function ApproveButton({ sessionId, approvalId, onReload }: { sessionId: string; approvalId: string; onReload?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await approveRequest(sessionId, approvalId);
      onReload?.();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 px-2 py-1 text-[10px] font-medium hover:bg-emerald-950/60 transition-colors disabled:opacity-50"
    >
      <CheckCircle size={10} className="inline mr-1" />
      Approve
    </button>
  );
}

function RejectButton({ sessionId, approvalId, onReload }: { sessionId: string; approvalId: string; onReload?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await rejectRequest(sessionId, approvalId);
      onReload?.();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex-1 rounded bg-secondary text-foreground border border-border px-2 py-1 text-[10px] font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
    >
      <XCircle size={10} className="inline mr-1" />
      Reject
    </button>
  );
}
