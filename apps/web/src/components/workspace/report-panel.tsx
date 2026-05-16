"use client";

import { Download, Trash2, Copy, FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import type { FinalReportPayload } from "@/types";

interface ReportPanelProps {
  report?: FinalReportPayload;
  onDownload?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
}

export default function ReportPanel({ report, onDownload, onDelete, onCopy }: ReportPanelProps) {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-2 p-4">
        <FileText size={24} />
        <p className="text-xs">No report available yet.</p>
        <p className="text-[10px] text-center">The report will be generated when the session completes.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold flex items-center gap-1.5">
          <FileText size={12} />
          Session Report
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onCopy}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Copy summary"
          >
            <Copy size={10} />
          </button>
          <button
            onClick={onDownload}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Download report"
          >
            <Download size={10} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
            title="Delete report"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded border border-border p-2.5 bg-secondary/20 space-y-2">
        <p className="text-[11px] text-foreground leading-relaxed">{report.summary}</p>
        {report.deploymentReady ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <CheckCircle2 size={10} />
            Ready for deployment
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
            <AlertTriangle size={10} />
            Not ready for deployment
          </span>
        )}
      </div>

      {/* Features */}
      <Section title="Features Implemented" count={report.featuresImplemented.length}>
        {report.featuresImplemented.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60">No features recorded.</p>
        ) : (
          <ul className="space-y-0.5">
            {report.featuresImplemented.map((f, i) => (
              <li key={i} className="text-[10px] text-foreground flex items-start gap-1">
                <span className="text-muted-foreground/40 mt-0.5">-</span>
                {f}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Files */}
      <Section title="Files Changed" count={report.filesChanged.length}>
        {report.filesChanged.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60">No files recorded.</p>
        ) : (
          <ul className="space-y-0.5">
            {report.filesChanged.map((f, i) => (
              <li key={i} className="text-[10px] text-foreground font-mono">{f}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* Commits */}
      <Section title="Commits" count={report.commits.length}>
        {report.commits.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60">No commits recorded.</p>
        ) : (
          <ul className="space-y-0.5">
            {report.commits.map((c, i) => (
              <li key={i} className="text-[10px] text-foreground font-mono">{c}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* Restore Points */}
      <Section title="Restore Points" count={report.restorePoints.length}>
        {report.restorePoints.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60">No restore points recorded.</p>
        ) : (
          <ul className="space-y-0.5">
            {report.restorePoints.map((r, i) => (
              <li key={i} className="text-[10px] text-foreground font-mono">{r}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* Tests */}
      <div className="rounded border border-border p-2 bg-secondary/20">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-foreground mb-1">
          <Clock size={10} />
          Tests Run: {report.testsRun}
        </div>
      </div>

      {/* Limitations */}
      {report.knownLimitations.length > 0 && (
        <Section title="Known Limitations" count={report.knownLimitations.length}>
          <ul className="space-y-0.5">
            {report.knownLimitations.map((l, i) => (
              <li key={i} className="text-[10px] text-amber-400 flex items-start gap-1">
                <AlertTriangle size={8} className="mt-0.5 shrink-0" />
                {l}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Skipped Tools */}
      {report.skippedTools.length > 0 && (
        <Section title="Skipped Tools" count={report.skippedTools.length}>
          <div className="flex flex-wrap gap-1">
            {report.skippedTools.map((t, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="rounded border border-border p-2.5 bg-secondary/20 space-y-1.5">
      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {title} {count !== undefined && <span className="text-muted-foreground/50">({count})</span>}
      </h4>
      {children}
    </div>
  );
}
