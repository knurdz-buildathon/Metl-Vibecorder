"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModeSelector from "@/components/assistant/mode-selector";
import type { SessionMode } from "@/types";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<SessionMode>("agent");
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    if (!prompt.trim()) return;
    setIsStarting(true);
    // TODO: call API to create session
    // const session = await createSession({ prompt, mode });
    // router.push(`/sessions/${session.id}/workspace`);
    
    // For now, redirect to a demo session
    router.push(`/sessions/demo`);
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
