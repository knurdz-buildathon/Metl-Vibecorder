"use client";

import { CheckCircle, XCircle, FileText } from "lucide-react";

interface PlanApprovalCardProps {
  approvalId: string;
  sessionId: string;
  planBody?: string;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
}

export default function PlanApprovalCard({
  approvalId,
  sessionId,
  planBody,
  onApprove,
  onReject,
}: PlanApprovalCardProps) {
  return (
    <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 my-2">
      <div className="flex items-center gap-2 text-amber-400 mb-2">
        <FileText size={14} />
        <span className="text-xs font-semibold uppercase">Plan Approval Required</span>
      </div>
      {planBody && (
        <pre className="text-xs text-zinc-300 mb-3 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono bg-zinc-900/50 rounded p-2">
          {planBody}
        </pre>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onApprove(approvalId)}
          className="flex-1 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 text-xs font-medium hover:bg-emerald-900/60 transition-colors"
        >
          <CheckCircle size={12} className="inline mr-1" />
          Approve
        </button>
        <button
          onClick={() => onReject(approvalId)}
          className="flex-1 rounded bg-red-900/40 text-red-300 border border-red-800/50 px-3 py-1.5 text-xs font-medium hover:bg-red-900/60 transition-colors"
        >
          <XCircle size={12} className="inline mr-1" />
          Reject
        </button>
      </div>
    </div>
  );
}
