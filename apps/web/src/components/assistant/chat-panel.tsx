"use client";

import { MessageSquare, User, Bot } from "lucide-react";
import type { ChatMessage } from "@/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend?: (message: string) => void;
  disabled?: boolean;
}

export default function ChatPanel({ messages, onSend, disabled }: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 font-semibold text-sm text-white">
        <MessageSquare size={16} />
        <span>VibeCoder</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-zinc-500 text-sm text-center mt-8">
            Start a conversation with VibeCoder.
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} className="text-emerald-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-900 text-zinc-200 border border-zinc-800"
              }`}
            >
              {msg.role === "assistant" ? (
                <MarkdownContent content={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              {msg.mode && (
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  mode: {msg.mode}
                </span>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        className="p-3 border-t border-zinc-800"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem(
            "message"
          ) as HTMLInputElement;
          if (input.value.trim() && onSend) {
            onSend(input.value.trim());
            input.value = "";
          }
        }}
      >
        <div className="flex gap-2">
          <input
            name="message"
            type="text"
            placeholder={disabled ? "Agent is working..." : "Ask VibeCoder..."}
            disabled={disabled}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled}
            className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown-like rendering without a full parser
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        codeContent = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <CodeBlock key={i} lang={codeLang} content={codeContent.join("\n")} />
        );
        codeContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-white mt-2 mb-1">
          {line.slice(2)}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h5 key={i} className="text-xs font-bold text-zinc-300 mt-2 mb-1">
          {line.slice(3)}
        </h5>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="text-xs text-zinc-300 ml-3">
          {line.slice(2)}
        </li>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="text-xs text-zinc-400 border-l-2 border-zinc-600 pl-2 my-1">
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="text-xs text-zinc-200 my-1">
          {line}
        </p>
      );
    } else {
      elements.push(<div key={i} className="h-1" />);
    }
  }

  if (inCodeBlock && codeContent.length > 0) {
    elements.push(
      <CodeBlock key="end" lang={codeLang} content={codeContent.join("\n")} />
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function CodeBlock({ lang, content }: { lang: string; content: string }) {
  return (
    <div className="my-1 rounded bg-zinc-900 border border-zinc-800 overflow-hidden">
      {lang && (
        <div className="px-2 py-0.5 bg-zinc-800 text-[10px] text-zinc-500 uppercase">
          {lang}
        </div>
      )}
      <pre className="px-2 py-1 text-[10px] text-zinc-300 overflow-x-auto font-mono">
        <code>{content}</code>
      </pre>
    </div>
  );
}
