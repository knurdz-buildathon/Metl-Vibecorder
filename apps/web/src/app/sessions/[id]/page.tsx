"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CloudIdeLayout from "@/components/workspace/cloud-ide-layout";
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

  const [mode, setMode] = useState<SessionMode>("agent");
  const [status, setStatus] = useState<SessionStatus>("created");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sessionId,
      role: "assistant",
      content:
        "Welcome to Metl-VibeCoder. I am a Gemini-powered AI coding assistant. Describe what you want to build and I will help you.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [checks, setChecks] = useState<CheckRun[]>([]);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] SSE ${connected ? "connected" : "disconnected"}`,
  ]);

  // Append incoming events to logs
  useState(() => {
    events.forEach((ev) => {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Event: ${ev.type || JSON.stringify(ev).slice(0, 100)}`,
      ]);
    });
  });

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

    // Send to API
    try {
      await fetch(`/api/sessions/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content, mode }),
      });
    } catch (e: any) {
      setLogs((prev) => [...prev, `Error sending message: ${e.message}`]);
    }

    // Simulate response for demo
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sessionId,
        role: "assistant",
        content: `Received your request in ${mode.toUpperCase()} mode. This is a demo response.`,
        mode,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 500);
  };

  const handleModeChange = (newMode: SessionMode) => {
    setMode(newMode);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Mode changed to ${newMode.toUpperCase()}`,
    ]);
  };

  return (
    <CloudIdeLayout
      title={`Session: ${sessionId}`}
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
