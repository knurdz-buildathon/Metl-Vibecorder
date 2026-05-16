"use client";

import { RotateCcw, Clock, Tag } from "lucide-react";
import type { RestorePointPayload } from "@/types";

interface RestorePanelProps {
  restorePoints: RestorePointPayload[];
  onRestore?: (point: RestorePointPayload) => void;
}

export default function RestorePanel({ restorePoints, onRestore }: RestorePanelProps) {
  if (restorePoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-2 p-4">
        <RotateCcw size={24} />
        <p className="text-xs">No restore points yet.</p>
        <p className="text-[10px] text-center">Restore points are created after successful verification stages.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Restore Points</h3>
      {restorePoints.map((point) => (
        <div
          key={point.id}
          className="rounded border border-border p-2.5 bg-secondary/20 hover:bg-secondary/40 transition-colors space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
              <Tag size={10} className="text-muted-foreground" />
              {point.label}
            </span>
            <button
              onClick={() => onRestore?.(point)}
              className="text-[9px] flex items-center gap-1 text-muted-foreground hover:text-foreground bg-secondary px-2 py-0.5 rounded transition-colors"
            >
              <RotateCcw size={8} />
              Restore
            </button>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
            <Clock size={8} />
            {new Date(point.createdAt).toLocaleString()}
          </div>
          {point.commitSha && (
            <div className="text-[9px] font-mono text-muted-foreground/60 truncate">
              {point.commitSha.slice(0, 12)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
