"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cpu, Wifi, Database, Server, ArrowLeft } from "lucide-react";
import { getProviderStatus } from "@/lib/api";

export default function SettingsPage() {
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProviderStatus()
      .then(setProviders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link href="/" className="flex items-center gap-1 text-zinc-500 hover:text-white">
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>

        {loading && <p className="text-zinc-500">Loading provider status...</p>}

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

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Environment</h2>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex justify-between">
              <span>GEMINI_PROVIDER</span>
              <span className="font-mono text-zinc-300">{process.env.NEXT_PUBLIC_GEMINI_PROVIDER || "developer"}</span>
            </div>
            <div className="flex justify-between">
              <span>GEMINI_MODEL</span>
              <span className="font-mono text-zinc-300">{process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-3.1-pro-preview-customtools"}</span>
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            connected
              ? "bg-emerald-900/50 text-emerald-400"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {connected ? "Connected" : "Not configured"}
        </span>
      </div>
      <div className="space-y-1.5">
        {details.map((d) => (
          <div key={d.label} className="flex justify-between text-sm">
            <span className="text-zinc-500">{d.label}</span>
            <span className="text-zinc-300">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
