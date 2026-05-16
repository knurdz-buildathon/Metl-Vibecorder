"use client";

import type { SessionMode } from "@/types";

interface ModeSelectorProps {
  value: SessionMode;
  onChange: (mode: SessionMode) => void;
  disabled?: boolean;
  approvalPending?: boolean;
}

const modes: { value: SessionMode; label: string; description: string }[] = [
  {
    value: "AGENT",
    label: "Agent",
    description: "Build automatically",
  },
  {
    value: "PLAN",
    label: "Plan",
    description: "Plan before building",
  },
  {
    value: "ASK",
    label: "Ask",
    description: "Ask and understand",
  },
];

export default function ModeSelector({ value, onChange, disabled, approvalPending }: ModeSelectorProps) {
  const handleChange = (newMode: SessionMode) => {
    if (newMode === value) return;

    // Safe-switching logic
    if (value === "ASK" && newMode === "AGENT") {
      const ok = typeof window !== "undefined" && window.confirm(
        "Switching to Agent will start code edits. Continue?"
      );
      if (!ok) return;
    }

    if (value === "PLAN" && newMode === "AGENT" && approvalPending) {
      const ok = typeof window !== "undefined" && window.confirm(
        "Skip plan approval and proceed with Agent mode?"
      );
      if (!ok) return;
    }

    if (value === "AGENT" && newMode === "ASK") {
      const ok = typeof window !== "undefined" && window.confirm(
        "Pausing new edits. Current edits may continue. Are you sure?"
      );
      if (!ok) return;
    }

    onChange(newMode);
  };

  return (
    <div className="flex gap-1 p-1 bg-secondary rounded-md border border-border">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => handleChange(mode.value)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors flex-1 text-center ${
            value === mode.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          } disabled:opacity-50`}
          title={mode.description}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
