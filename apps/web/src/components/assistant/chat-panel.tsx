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
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-900 text-zinc-200 border border-zinc-800"
              }`}
            >
              {msg.content}
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
            placeholder="Ask VibeCoder..."
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
