"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cpu, Server, Database, ArrowLeft, RefreshCw } from "lucide-react";
import { getProviderStatus } from "@/lib/api";

export default function SettingsPage() {
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProviderStatus();
      setProviders(data);
    } catch {
      setProviders(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 rounded-md bg-secondary text-foreground px-3 py-1.5 text-xs hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Re-check
          </button>
        </div>

        {loading && <p className="text-muted-foreground">Loading provider status...</p>}

        {!loading && providers && (
          <>
            <ProviderCard
              title="Gemini AI"
              icon={<Cpu size={18} />}
              connected={providers.gemini?.configured}
              details={[
                { label: "Mode", value: providers.gemini?.mode || "developer" },
                { label: "Model", value: providers.gemini?.model || "-" },
              ]}
            />

            <ProviderCard
              title="Workspace"
              icon={<Server size={18} />}
              connected={providers.workspace?.status === "running"}
              details={[
                { label: "Provider", value: providers.workspace?.provider || "local-docker" },
                { label: "Status", value: providers.workspace?.status || "not_started" },
              ]}
            />

            <ProviderCard
              title="GitHub"
              icon={<Database size={18} />}
              connected={providers.github?.configured}
              details={[
                { label: "OAuth", value: providers.github?.configured ? "Configured" : "Not configured" },
              ]}
            />
          </>
        )}

        <div className="rounded-xl border border-border bg-card/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Environment</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>GEMINI_PROVIDER</span>
              <span className="font-mono text-foreground">{process.env.NEXT_PUBLIC_GEMINI_PROVIDER || "developer"}</span>
            </div>
            <div className="flex justify-between">
              <span>GEMINI_MODEL</span>
              <span className="font-mono text-foreground">{process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-3.1-pro-preview-customtools"}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProviderCard({
  title,
  icon,
  connected,
  details,
}: {
  title: string;
  icon: React.ReactNode;
  connected: boolean;
  details: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            connected
              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40"
              : "bg-secondary text-muted-foreground border border-border"
          }`}
        >
          {connected ? "Connected" : "Not configured"}
        </span>
      </div>
      <div className="space-y-1.5">
        {details.map((d) => (
          <div key={d.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{d.label}</span>
            <span className="text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
