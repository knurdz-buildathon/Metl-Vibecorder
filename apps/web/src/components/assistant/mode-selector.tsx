"use client";

import type { SessionMode } from "@/types";

interface ModeSelectorProps {
  value: SessionMode;
  onChange: (mode: SessionMode) => void;
  disabled?: boolean;
}

const modes: { value: SessionMode; label: string; description: string }[] = [
  {
    value: "ask",
    label: "Ask",
    description: "Understand the repo. No edits.",
  },
  {
    value: "plan",
    label: "Plan",
    description: "Generate a plan. Wait for approval.",
  },
  {
    value: "agent",
    label: "Agent",
    description: "Build automatically with checks.",
  },
  {
    value: "repair",
    label: "Repair",
    description: "Fix failed checks.",
  },
  {
    value: "review",
    label: "Review",
    description: "Review code and report risks.",
  },
];

export default function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-zinc-900 rounded-md border border-zinc-800">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            value === mode.value
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          } disabled:opacity-50`}
          title={mode.description}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
