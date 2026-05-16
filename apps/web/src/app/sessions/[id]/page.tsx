"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CloudIdeLayout from "@/components/workspace/cloud-ide-layout";
import type {
  SessionMode,
  SessionStatus,
  ChatMessage,
  CheckRun,
} from "@/types";

export default function SessionWorkspacePage() {
  const params = useParams();
  const sessionId = params.id as string;

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
  const [checks] = useState<CheckRun[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const handleSendMessage = (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId,
      role: "user",
      content,
      mode,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Simulate assistant response
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
