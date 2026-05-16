"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  MessageSquare,
  LayoutTemplate,
  Settings,
  Cpu,
  GitBranch,
  User,
  Sparkles,
  Zap,
  FolderOpen,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { createSession, startSession } from "@/lib/api";
import type { SessionMode } from "@/types";

const examplePrompts = [
  "Build a task management dashboard with teams and deadlines",
  "Create a REST API with user authentication and role-based access",
  "Generate a responsive portfolio website with dark mode",
  "Set up a Next.js app with Prisma, Tailwind, and NextAuth",
];

export default function NewWorkspacePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<SessionMode>("AGENT");
  const [repoUrl, setRepoUrl] = useState("");
  const [projectType, setProjectType] = useState("");
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
        repoUrl: repoUrl || undefined,
      });
      await startSession(session.id);
      router.push(`/sessions/${session.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create session");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Sidebar — same style as home */}
      <aside className="w-14 md:w-60 flex-shrink-0 flex flex-col h-screen bg-card border-r border-border">
        <div className="h-9 flex items-center justify-between px-3 border-b border-border">
          <Link href="/" className="hidden md:flex items-center gap-2 text-sm font-bold">
            <Sparkles size={16} className="text-primary" />
            <span>MetlCode</span>
          </Link>
          <Sparkles size={16} className="md:hidden text-primary mx-auto" />
        </div>
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
          <SidebarItem icon={<Plus size={16} />} label="New Project" href="/sessions/new" active />
          <SidebarItem icon={<FolderOpen size={16} />} label="Projects" href="/sessions" />
          <SidebarItem icon={<MessageSquare size={16} />} label="Chats" href="/sessions" />
          <SidebarItem icon={<LayoutTemplate size={16} />} label="Templates" href="/sessions/new" />
        </div>
        <div className="border-t border-border py-2 space-y-0.5">
          <SidebarItem icon={<Settings size={16} />} label="Settings" href="/settings" />
          <SidebarItem icon={<User size={16} />} label="Profile" href="/settings" />
        </div>
      </aside>

      {/* Main — empty IDE workspace with central composer */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="h-9 flex items-center justify-between px-4 border-b border-border bg-card">
          <Link href="/" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={10} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <StatusDot label="Gemini" />
            <Link href="/settings" className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Settings size={10} />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto">
          <div className="w-full max-w-2xl space-y-6 py-12">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">New Workspace</h1>
              <p className="text-sm text-muted-foreground">
                Ask MetlCode to build a dashboard, website, API, or app...
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                className="w-full h-36 rounded-lg border border-border bg-card p-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                placeholder="Describe what you want to build..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />

              <div className="flex items-center gap-2">
                <GitBranch size={14} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="https://github.com/owner/repo (optional)"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 p-1 bg-card rounded-md border border-border">
                  {[
                    { value: "AGENT" as SessionMode, label: "Agent", desc: "Build automatically" },
                    { value: "PLAN" as SessionMode, label: "Plan", desc: "Plan before building" },
                    { value: "ASK" as SessionMode, label: "Ask", desc: "Ask and understand" },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      title={m.desc}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        mode === m.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="text-xs bg-card border border-border rounded-md px-2 py-1.5 text-muted-foreground focus:outline-none"
                >
                  <option value="">Project type</option>
                  <option value="nextjs">Next.js</option>
                  <option value="react">React</option>
                  <option value="node">Node.js API</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                </select>

                <button
                  onClick={handleStart}
                  disabled={isStarting || !prompt.trim()}
                  className="flex items-center gap-1.5 ml-auto rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={12} />
                  {isStarting ? "Building..." : "Start Building"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 text-xs">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  href,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-1.5 mx-1 text-xs rounded transition-colors ${
        active
          ? "text-foreground bg-secondary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

function StatusDot({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
