"use client";

import { useState, useEffect } from "react";
import { Cpu, Server, Database, Github, AlertCircle } from "lucide-react";
import type { SessionMode } from "@/types";

interface ProviderStatus {
  gemini?: {
    configured: boolean;
    mode: string;
    model: string;
    promptVersion?: string;
  };
  workspace?: {
    status: string;
    provider: string;
  };
  github?: {
    configured: boolean;
  };
  queue?: string;
  verification?: string[];
}

export default function ProviderStatusBar() {
  const [providers, setProviders] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    fetch("/api/providers/status")
      .then((r) => r.json())
      .then((d) => setProviders(d))
      .catch(() => setProviders(null));
  }, []);

  const gemini = providers?.gemini;
  const workspace = providers?.workspace;
  const github = providers?.github;

  return (
    <div className="flex items-center gap-4 h-7 px-3 bg-background border-t border-border text-[10px] text-muted-foreground shrink-0">
      <div className="flex items-center gap-1">
        <Cpu size={10} />
        <span className="font-medium">MetlCode VibeCoder</span>
      </div>

      <div className="hidden md:flex items-center gap-1">
        <Github size={10} />
        <span className={gemini?.configured ? "text-emerald-500" : "text-muted-foreground/50"}>
          Gemini
        </span>
        {gemini?.model && (
          <span className="text-muted-foreground/60">{gemini.model}</span>
        )}
      </div>

      <div className="hidden md:flex items-center gap-1">
        <Server size={10} />
        <span className={workspace?.status === "running" ? "text-emerald-500" : "text-muted-foreground/50"}>
          {workspace?.provider || "Local Docker"}
        </span>
      </div>

      <div className="hidden md:flex items-center gap-1">
        <Database size={10} />
        <span className={github?.configured ? "text-emerald-500" : "text-muted-foreground/50"}>
          GitHub {github?.configured ? "connected" : "offline"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {gemini?.promptVersion && (
          <span className="text-muted-foreground/50">Super prompt v{gemini.promptVersion}</span>
        )}
        <span>v0.1.0</span>
      </div>
    </div>
  );
}
