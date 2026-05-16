"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FolderGit, ArrowLeft, Clock, Code2, Plus, Loader2 } from "lucide-react";

interface ProjectDetail {
  id: string;
  name: string;
  description?: string;
  language: string;
  repoUrl?: string;
  githubRepo?: string;
  createdAt: string;
  sessions?: SessionItem[];
}

interface SessionItem {
  id: string;
  mode: string;
  status: string;
  userPrompt: string;
  createdAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data.project || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-zinc-400">Project not found.</p>
          <Link href="/projects" className="text-white underline">Back to Projects</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/projects" className="text-zinc-400 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-zinc-400 text-sm mt-1">{project.description}</p>
              )}
            </div>
          </div>
          <Link
            href={`/sessions/new?projectId=${project.id}`}
            className="flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-200"
          >
            <Plus size={16} />
            New Session
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard label="Language" value={project.language} />
          <InfoCard label="Sessions" value={project.sessions?.length || 0} />
          <InfoCard label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
        </div>

        {project.repoUrl && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 flex items-center justify-between">
            <code className="text-sm text-zinc-300 truncate">{project.repoUrl}</code>
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-white underline whitespace-nowrap"
            >
              Open &rarr;
            </a>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">Sessions</h2>
          {!project.sessions?.length ? (
            <div className="text-center py-12 rounded-xl border border-zinc-800 bg-zinc-900/30">
              <p className="text-zinc-500">No sessions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 hover:bg-zinc-900 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {s.mode}
                      </span>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-sm text-zinc-300 truncate">{s.userPrompt}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Code2 size={16} className="text-zinc-600 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
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
    <span className={`text-xs capitalize ${colors[status] || "text-zinc-500"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
