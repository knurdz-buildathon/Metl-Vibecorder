"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Clock, Activity } from "lucide-react";
import { getHealth, getModelHealth, getAgentHealth } from "@/lib/api";

interface SessionSummary {
  id: string;
  mode: string;
  status: string;
  userPrompt: string;
  updatedAt: string;
}

export default function HomePage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [health, setHealth] = useState({ web: false, model: false, agent: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/sessions").then((r) => r.json()),
      getHealth(),
      getModelHealth(),
      getAgentHealth(),
    ])
      .then(([sessionsData, _web, model, agent]) => {
        setSessions(sessionsData.sessions?.slice(0, 5) || []);
        setHealth({
          web: true,
          model: model?.configured || false,
          agent: agent?.healthy || false,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 px-6 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">Metl-VibeCoder</h1>
        <p className="text-xl text-zinc-400 mb-2">
          AI coding workspace powered by Gemini.
        </p>
        <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
          Understand, generate, verify, repair, and explain code — all in one browser IDE.
        </p>

        <div className="flex justify-center gap-4 mb-8">
          <Link
            href="/sessions/new"
            className="rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            New Workspace
          </Link>
          <Link
            href="/settings"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold hover:bg-zinc-800 transition-colors"
          >
            Settings
          </Link>
        </div>

        {/* Provider Status */}
        <div className="flex justify-center gap-6 text-xs text-zinc-400">
          <StatusBadge label="Web" ok={health.web} />
          <StatusBadge label="Gemini" ok={health.model} />
          <StatusBadge label="Agent" ok={health.agent} />
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Sessions</h2>
          <Link href="/sessions" className="text-sm text-zinc-400 hover:text-white">
            View all &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="text-zinc-500 text-center py-8">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <Activity size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No sessions yet.</p>
            <p className="text-sm text-zinc-500 mt-1">
              Start by creating a new workspace.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {s.mode}
                  </span>
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 truncate">{s.userPrompt}</p>
                <p className="text-xs text-zinc-500 mt-1 capitalize">
                  Status: {s.status.replace(/_/g, " ")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modes explanation */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Ask", desc: "Understand the repo without editing." },
            { title: "Plan", desc: "Get an implementation plan before building." },
            { title: "Agent", desc: "Build automatically with checks and repair." },
          ].map((mode) => (
            <div
              key={mode.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"
            >
              <h3 className="text-lg font-semibold mb-2">{mode.title}</h3>
              <p className="text-sm text-zinc-400">{mode.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-zinc-600"}`} />
      <span>{label}</span>
    </div>
  );
}
