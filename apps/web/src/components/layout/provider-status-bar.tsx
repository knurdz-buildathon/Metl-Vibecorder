"use client";

import { Cpu } from "lucide-react";

export default function ProviderStatusBar() {
  return (
    <div className="flex items-center gap-4 h-7 px-4 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-500">
      <div className="flex items-center gap-1">
        <Cpu size={12} />
        <span>Metl-VibeCoder</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>Gemini developer</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-zinc-600" />
        <span>Local Docker</span>
      </div>
      <div className="ml-auto">
        <span>v0.1.0</span>
      </div>
    </div>
  );
}
