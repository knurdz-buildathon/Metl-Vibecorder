"use client";

import { useState, useEffect } from "react";
import {
  X,
  Cpu,
  Server,
  Database,
  Github,
  ShieldCheck,
  RefreshCw,
  Wrench,
  Puzzle,
  Zap,
  FileCode,
} from "lucide-react";

interface ProviderData {
  gemini?: {
    configured: boolean;
    mode: "vertex" | "developer" | string;
    model: string;
    promptVersion?: string;
  };
  codingAgent?: {
    name: string;
    repairMode: string;
  };
  workspace?: {
    status: string;
    provider: string;
  };
  ide?: {
    provider: string;
    status: string;
  };
  github?: {
    configured: boolean;
  };
  queue?: "inline" | "redis" | string;
  verification?: string[];
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [providers, setProviders] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/providers/status");
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Settings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Refresh"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center text-xs text-muted-foreground py-8">Loading provider status...</div>
          ) : (
            <>
              {/* Model Provider */}
              <StatusGroup icon={<Cpu size={14} />} title="Model Provider" status={providers?.gemini?.configured ? "connected" : "not_configured"}>
                <StatusRow label="Provider" value="Gemini" />
                <StatusRow label="Mode" value={providers?.gemini?.mode || "developer"} />
                <StatusRow label="Model" value={providers?.gemini?.model || "-"} />
              </StatusGroup>

              {/* Coding Agent */}
              <StatusGroup icon={<Zap size={14} />} title="Coding Agent" status={providers?.gemini?.configured ? "connected" : "not_configured"}>
                <StatusRow label="Agent" value={providers?.codingAgent?.name || "MetlCode VibeCoder"} />
                <StatusRow label="Repair mode" value={providers?.codingAgent?.repairMode || "VibeCoder repair mode"} />
                <StatusRow label="Super prompt" value={providers?.gemini?.promptVersion ? `v${providers.gemini.promptVersion}` : "active"} />
              </StatusGroup>

              {/* IDE Provider */}
              <StatusGroup icon={<FileCode size={14} />} title="IDE Provider" status={providers?.ide?.status === "ready" ? "connected" : "not_configured"}>
                <StatusRow label="Provider" value={providers?.ide?.provider || "disabled"} />
                <StatusRow label="Status" value={providers?.ide?.status || "disabled"} />
              </StatusGroup>

              {/* Workspace Provider */}
              <StatusGroup icon={<Server size={14} />} title="Workspace Provider" status={providers?.workspace?.status === "running" ? "connected" : "not_configured"}>
                <StatusRow label="Provider" value={providers?.workspace?.provider || "local-docker"} />
                <StatusRow label="Status" value={providers?.workspace?.status || "not_started"} />
              </StatusGroup>

              {/* GitHub */}
              <StatusGroup icon={<Github size={14} />} title="GitHub" status={providers?.github?.configured ? "connected" : "not_configured"}>
                <StatusRow label="OAuth" value={providers?.github?.configured ? "Connected" : "Not connected"} />
              </StatusGroup>

              {/* Queue */}
              <StatusGroup icon={<Puzzle size={14} />} title="Queue" status="connected">
                <StatusRow label="Driver" value={providers?.queue || "inline"} />
              </StatusGroup>

              {/* Verification */}
              <StatusGroup icon={<ShieldCheck size={14} />} title="Verification" status="connected">
                <div className="flex flex-wrap gap-1 mt-1">
                  {(providers?.verification || ["npm checks", "Playwright", "Gemini review"]).map((v) => (
                    <span key={v} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                      {v}
                    </span>
                  ))}
                </div>
              </StatusGroup>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusGroup({
  icon,
  title,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  status: "connected" | "not_configured";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          {icon}
          {title}
        </div>
        <span
          className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
            status === "connected"
              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
              : "bg-secondary text-muted-foreground border border-border"
          }`}
        >
          {status === "connected" ? "Connected" : "Not configured"}
        </span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-mono">{value}</span>
    </div>
  );
}
