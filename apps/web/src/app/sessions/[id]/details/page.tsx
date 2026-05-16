"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle2, XCircle, FileText, GitPullRequest, Code2, Terminal, Loader2 } from "lucide-react";
import Link from "next/link";

interface SessionDetails {
  id: string;
  mode: string;
  status: string;
  userPrompt: string;
  modelUsed: string;
  createdAt: string;
  updatedAt: string;
  workspaceUrl?: string;
  messages?: any[];
  checkRuns?: any[];
  fileChanges?: any[];
  approvalRequests?: any[];
}

export default function SessionDetailsPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setSession(data.session || null);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load session"); setLoading(false); });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-zinc-400">{error || "Session not found."}</p>
          <Link href="/" className="text-white underline">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Session Details</h1>
            <p className="text-zinc-400 mt-1">ID: {session.id}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="flex items-center gap-1 text-zinc-400 hover:text-white">
              <ArrowLeft size={16} />
              Dashboard
            </Link>
            <Link href={`/sessions/${session.id}`} className="flex items-center gap-1 text-zinc-400 hover:text-white">
              <Code2 size={16} />
              IDE
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard icon={<Terminal size={18} />} label="Mode" value={session.mode} />
          <InfoCard icon={<Clock size={18} />} label="Status" value={<StatusBadge status={session.status} />} />
          <InfoCard icon={<Code2 size={18} />} label="Model" value={session.modelUsed?.replace("gemini-", "") || "-"} />
        </div>

        {/* Prompt */}
        <Section title="Prompt" icon={<Terminal size={16} />}>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-sm text-zinc-300">{session.userPrompt}</p>
          </div>
        </Section>

        {/* Messages */}
        <Section title={`Messages (${session.messages?.length || 0})`} icon={<FileText size={16} />}>
          <div className="space-y-2">
            {session.messages?.map((msg: any, i: number) => (
              <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${msg.role === "user" ? "text-blue-400" : msg.role === "assistant" ? "text-emerald-400" : "text-zinc-500"}`}>
                    {msg.role.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-zinc-600">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-zinc-300">{msg.content}</p>
              </div>
            )) || <p className="text-zinc-500 text-sm">No messages yet.</p>}
          </div>
        </Section>

        {/* Check Runs */}
        <Section title={`Check Runs (${session.checkRuns?.length || 0})`} icon={<CheckCircle2 size={16} />}>
          <div className="space-y-2">
            {session.checkRuns?.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                <div>
                  <span className="text-sm text-zinc-300 capitalize">{c.type}</span>
                  <p className="text-xs text-zinc-500 font-mono">{c.command}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            )) || <p className="text-zinc-500 text-sm">No checks run yet.</p>}
          </div>
        </Section>

        {/* File Changes */}
        <Section title={`File Changes (${session.fileChanges?.length || 0})`} icon={<GitPullRequest size={16} />}>
          <div className="space-y-2">
            {session.fileChanges?.map((f: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                <span className="text-xs font-medium text-amber-400">{f.operation}</span>
                <span className="text-sm text-zinc-300 font-mono truncate">{f.filePath}</span>
              </div>
            )) || <p className="text-zinc-500 text-sm">No file changes yet.</p>}
          </div>
        </Section>

        {/* Approvals */}
        {session.approvalRequests && session.approvalRequests.length > 0 && (
          <Section title="Pending Approvals" icon={<FileText size={16} />}>
            <div className="space-y-2">
              {session.approvalRequests.map((a: any, i: number) => (
                <div key={i} className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <FileText size={14} />
                    <span className="text-xs font-semibold uppercase">{a.type} Approval</span>
                  </div>
                  {a.title && <h4 className="text-sm font-medium text-white mb-1">{a.title}</h4>}
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">{a.body}</pre>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Workspace Info */}
        {session.workspaceUrl && (
          <Section title="Workspace" icon={<Code2 size={16} />}>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between gap-4">
              <code className="text-sm text-zinc-300 truncate">{session.workspaceUrl}</code>
              <Link href={`/sessions/${session.id}`} className="text-xs text-zinc-400 hover:text-white underline whitespace-nowrap">
                Open IDE &rarr;
              </Link>
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
      <div className="flex items-center gap-2 text-zinc-500 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "text-emerald-400",
    failed: "text-red-400",
    passed: "text-emerald-400",
    running: "text-amber-400",
    paused: "text-amber-400",
    awaiting_plan_approval: "text-amber-400",
  };
  return (
    <span className={`text-sm font-medium capitalize ${colors[status] || "text-zinc-400"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
