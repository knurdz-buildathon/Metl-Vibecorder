"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderGit, Clock, ArrowRight, Plus } from "lucide-react";
import { getProjects } from "@/lib/api";

interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  language: string;
  createdAt: string;
  sessions?: { id: string; mode: string; status: string }[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then((res) => {
        setProjects(res.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-zinc-400 mt-1">Manage your repos and workspaces.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/github/import"
              className="flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-200"
            >
              <Plus size={16} />
              Import Repo
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-800"
            >
              Home
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-zinc-500 text-center py-12">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 mb-4">No projects yet.</p>
            <Link href="/github/import" className="text-white underline">
              Import your first repo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderGit size={20} className="text-zinc-500" />
                    <h3 className="text-lg font-semibold group-hover:text-white">{p.name}</h3>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                    {p.language}
                  </span>
                </div>
                {p.description && (
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{p.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{p.sessions?.length || 0} sessions</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
