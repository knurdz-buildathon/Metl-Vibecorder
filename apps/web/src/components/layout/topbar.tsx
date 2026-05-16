"use client";

import Link from "next/link";
import { Cpu, Wifi } from "lucide-react";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  return (
    <div className="flex items-center justify-between h-12 px-4 bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center gap-4">
        <span className="font-semibold text-white">{title || "Workspace"}</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <Link
          href="/settings"
          className="flex items-center gap-1 hover:text-white"
        >
          <Cpu size={14} />
          <span>Gemini</span>
        </Link>
        <span className="flex items-center gap-1 text-emerald-400">
          <Wifi size={14} />
          <span>Connected</span>
        </span>
      </div>
    </div>
  );
}
