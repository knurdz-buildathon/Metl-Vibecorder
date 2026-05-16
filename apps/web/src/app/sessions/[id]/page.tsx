"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import CloudIdeLayout from "@/components/workspace/cloud-ide-layout";
import { sendMessage, getSession } from "@/lib/api";
import { useSessionEvents } from "@/hooks/use-session-events";
import type {
  SessionMode,
  SessionStatus,
  ChatMessage,
  CheckRun,
} from "@/types";

export default function SessionWorkspacePage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { connected, events } = useSessionEvents(sessionId);

  const [mode, setMode] = useState<SessionMode>("AGENT");
  const [status, setStatus] = useState<SessionStatus>("created");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [checks, setChecks] = useState<CheckRun[]>([]);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] SSE ${connected ? "connected" : "disconnected"}`,
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load session from API
  useEffect(() => {
    let cancelled = false;
    getSession(sessionId)
      .then(({ session }: any) => {
        if (cancelled) return;
        setMode(session.mode as SessionMode);
        setStatus(session.status as SessionStatus);
        setMessages(
          session.messages?.map((m: any) => ({
            id: m.id,
            sessionId: m.sessionId,
            role: m.role,
            content: m.content,
            mode: m.mode,
            createdAt: m.createdAt,
          })) || []
        );
        setChecks(
          session.checkRuns?.map((c: any) => ({
            id: c.id,
            sessionId: c.sessionId,
            type: c.type,
            status: c.status,
            command: c.command,
            stdout: c.stdout,
            stderr: c.stderr,
            createdAt: c.createdAt,
          })) || []
        );
        setLoading(false);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Append SSE events to logs
  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Event: ${latest.type || JSON.stringify(latest).slice(0, 80)}`,
    ]);
  }, [events]);

  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId,
      role: "user",
      content,
      mode,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      await sendMessage(sessionId, { role: "user", content, mode });
    } catch (e: any) {
      setLogs((prev) => [...prev, `Error sending message: ${e.message}`]);
    }
  };

  const handleModeChange = (newMode: SessionMode) => {
    setMode(newMode);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Mode changed to ${newMode.toUpperCase()}`,
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-400">{error}</p>
          <a href="/" className="text-white underline">
            Return to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <CloudIdeLayout
      title={`Session: ${sessionId.slice(0, 8)}`}
      mode={mode}
      status={status}
      messages={messages}
      checks={checks}
      logs={logs}
      onSendMessage={handleSendMessage}
      onModeChange={handleModeChange}
    />
  );
}
