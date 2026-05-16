"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModeSelector from "@/components/assistant/mode-selector";
import { createSession, startSession } from "@/lib/api";
import type { SessionMode } from "@/types";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<SessionMode>("AGENT");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!prompt.trim()) return;
    setIsStarting(true);
    setError("");

    try {
      const { session } = await createSession({
        userPrompt: prompt,
        mode,
      });
      // Kick off agent asynchronously
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
            Describe what you want to build or attach a GitHub repo.
          </p>
        </div>

        <div className="space-y-4">
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
