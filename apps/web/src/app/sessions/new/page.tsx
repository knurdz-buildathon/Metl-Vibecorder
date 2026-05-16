"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModeSelector from "@/components/assistant/mode-selector";
import { createSession, startSession, getProjects, createProject } from "@/lib/api";
import type { SessionMode } from "@/types";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<SessionMode>("AGENT");
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getProjects()
      .then((res) => {
        setProjects(res.projects || []);
        if (res.projects?.length > 0) {
          setProjectId(res.projects[0].id);
        }
      })
      .catch(() => {
        setProjects([]);
      });
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
      });
      const created = res.project;
      setProjects((prev) => [created, ...prev]);
      setProjectId(created.id);
      setShowCreateProject(false);
      setNewProjectName("");
      setNewProjectDescription("");
    } catch (e: any) {
      setError(e.message || "Failed to create project");
    }
  };

  const handleStart = async () => {
    if (!prompt.trim()) return;
    setIsStarting(true);
    setError("");

    try {
      const { session } = await createSession({
        projectId: projectId || undefined,
        userPrompt: prompt,
        mode,
      });
      await startSession(session.id);
      router.push(`/sessions/${session.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create session");
      setIsStarting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">New Workspace</h1>
          <p className="text-zinc-400">
            Select a project and tell VibeCoder what to build.
          </p>
        </div>

        <div className="space-y-4">
          {/* Project selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-zinc-400">Project</label>
              <button
                onClick={() => setShowCreateProject((s) => !s)}
                className="text-xs text-zinc-400 hover:text-white underline"
                type="button"
              >
                {showCreateProject ? "Cancel" : "+ New Project"}
              </button>
            </div>

            {showCreateProject ? (
              <div className="space-y-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
                <input
                  type="text"
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
                />
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                {projects.length === 0 && (
                  <option value="">(No projects yet)</option>
                )}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Prompt</label>
            <textarea
              className="w-full h-32 rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Build a task management app with teams and deadlines..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Mode</label>
            <ModeSelector value={mode} onChange={setMode} />
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={isStarting || !prompt.trim()}
            className="w-full rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? "Starting..." : "Start Session"}
          </button>
        </div>

        <Link href="/" className="text-zinc-500 hover:text-white text-sm inline-block">
          &larr; Back to home
        </Link>
      </div>
    </main>
  );
}
