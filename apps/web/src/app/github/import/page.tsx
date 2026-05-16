"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GitBranch, ArrowRight } from "lucide-react";

export default function GitHubImportPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [name, setName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!repoUrl.trim()) return;
    setIsImporting(true);
    setError("");

    try {
      const res = await fetch("/api/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          name: name.trim() || undefined,
          githubRepo: repoUrl.trim().replace("https://github.com/", "").replace(".git", ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      router.push(`/sessions/${data.session.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to import");
      setIsImporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <GitBranch size={32} className="text-zinc-400 mx-auto" />
          <h1 className="text-2xl font-bold">Import from GitHub</h1>
          <p className="text-zinc-400 text-sm">
            Clone a public repo into a new workspace.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Repository URL</label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Project Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={isImporting || !repoUrl.trim()}
            className="w-full rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isImporting ? "Importing..." : "Import Repo"}
            <ArrowRight size={16} />
          </button>
        </div>

        <Link href="/sessions/new" className="text-zinc-500 hover:text-white text-sm inline-block">
          &larr; Create blank workspace instead
        </Link>
      </div>
    </main>
  );
}
