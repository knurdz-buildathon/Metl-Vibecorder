"use client";

import { CheckCircle, XCircle, FileText, Pencil, MessageCircle } from "lucide-react";

interface PlanApprovalCardProps {
  approvalId: string;
  sessionId: string;
  planBody?: string;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
  onEdit?: () => void;
  onAskMore?: () => void;
}

export default function PlanApprovalCard({
  approvalId,
  sessionId,
  planBody,
  onApprove,
  onReject,
  onEdit,
  onAskMore,
}: PlanApprovalCardProps) {
  return (
    <div className="rounded-lg border border-amber-900/30 bg-amber-950/10 p-3 space-y-2.5">
      <div className="flex items-center gap-2 text-amber-400">
        <FileText size={14} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">Plan Approval Required</span>
      </div>
      {planBody && (
        <pre className="text-[10px] text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap font-mono bg-secondary/30 rounded p-2">
          {planBody}
        </pre>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onApprove(approvalId)}
          className="flex items-center justify-center gap-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 px-3 py-1.5 text-[10px] font-medium hover:bg-emerald-950/60 transition-colors"
        >
          <CheckCircle size={10} />
          Approve & Build
        </button>
        <button
          onClick={() => onReject(approvalId)}
          className="flex items-center justify-center gap-1 rounded bg-secondary text-foreground border border-border px-3 py-1.5 text-[10px] font-medium hover:bg-secondary/80 transition-colors"
        >
          <XCircle size={10} />
          Reject
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-1 rounded bg-secondary text-foreground border border-border px-3 py-1.5 text-[10px] font-medium hover:bg-secondary/80 transition-colors"
          >
            <Pencil size={10} />
            Edit Plan
          </button>
        )}
        {onAskMore && (
          <button
            onClick={onAskMore}
            className="flex items-center justify-center gap-1 rounded bg-secondary text-foreground border border-border px-3 py-1.5 text-[10px] font-medium hover:bg-secondary/80 transition-colors"
          >
            <MessageCircle size={10} />
            Ask More
          </button>
        )}
      </div>
    </div>
  );
}
