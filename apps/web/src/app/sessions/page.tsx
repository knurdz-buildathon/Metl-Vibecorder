"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Clock, Trash2, Home } from "lucide-react";

interface SessionSummary {
  id: string;
  mode: string;
  status: string;
  userPrompt: string;
  updatedAt: string;
}

export default function SessionsListPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Sessions</h1>
            <p className="text-muted-foreground mt-1">Manage your AI coding sessions.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/sessions/new"
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              New
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
            >
              <Home size={14} />
              Home
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground text-center py-12">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No sessions found.</p>
            <Link href="/sessions/new" className="text-foreground underline">
              Create your first session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4 hover:bg-card transition-colors group"
              >
                <Link href={`/sessions/${s.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      {s.mode}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {s.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground truncate">{s.userPrompt}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock size={10} />
                    {new Date(s.updatedAt).toLocaleString()}
                  </p>
                </Link>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
