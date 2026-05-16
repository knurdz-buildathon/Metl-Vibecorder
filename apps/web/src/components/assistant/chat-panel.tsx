"use client";

import { MessageSquare, User, Bot, FileText, Search, Lightbulb } from "lucide-react";
import type { ChatMessage, SessionMode, ApprovalPayload } from "@/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend?: (message: string) => void;
  disabled?: boolean;
  mode?: SessionMode;
  approvals?: ApprovalPayload[];
  onModeChange?: (mode: SessionMode) => void;
}

export default function ChatPanel({ messages, onSend, disabled, mode, approvals = [], onModeChange }: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background border-t border-border">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border text-[11px] font-semibold text-foreground">
        <MessageSquare size={12} />
        <span>MetlCode VibeCoder</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-muted-foreground/40 text-xs text-center mt-8">
            {mode === "ASK" ? "Ask anything about your project." :
             mode === "PLAN" ? "VibeCoder will plan and ask for your approval." :
             "VibeCoder is building automatically. Ask if you need anything."}
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Inline approvals in Plan mode */}
        {mode === "PLAN" && approvals.filter((a) => a.status === "pending").map((approval) => (
          <PlanApprovalInline key={approval.id} approval={approval} />
        ))}

        {/* Suggest mode switch when user asks for change in Ask mode */}
        {mode === "ASK" && messages.some((m) => m.role === "user" && looksLikeChangeRequest(m.content)) && (
          <div className="flex flex-col gap-1.5 p-2 rounded bg-secondary/20 border border-border">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Lightbulb size={10} />
              Want to make changes?
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => onModeChange?.("AGENT")}
                className="text-[9px] px-2 py-0.5 rounded bg-primary text-primary-foreground font-medium"
              >
                Switch to Agent
              </button>
              <button
                onClick={() => onModeChange?.("PLAN")}
                className="text-[9px] px-2 py-0.5 rounded bg-secondary text-foreground font-medium"
              >
                Switch to Plan
              </button>
            </div>
          </div>
        )}
      </div>

      <form
        className="p-2.5 border-t border-border"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("message") as HTMLInputElement;
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
            className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled}
            className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-[11px] font-medium hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      {msg.role === "assistant" && (
        <div className="w-5 h-5 rounded flex items-center justify-center bg-secondary shrink-0 mt-0.5">
          <Bot size={10} className="text-emerald-400" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${
          msg.role === "user"
            ? "bg-secondary text-foreground"
            : "bg-card text-foreground border border-border"
        }`}
      >
        {msg.role === "assistant" ? (
          <MarkdownContent content={msg.content} />
        ) : (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        )}
        {msg.mode && (
          <span className="text-[9px] text-muted-foreground/50 mt-1 block">
            {msg.mode}
          </span>
        )}
      </div>
      {msg.role === "user" && (
        <div className="w-5 h-5 rounded flex items-center justify-center bg-secondary shrink-0 mt-0.5">
          <User size={10} className="text-foreground" />
        </div>
      )}
    </div>
  );
}

function PlanApprovalInline({ approval }: { approval: ApprovalPayload }) {
  return (
    <div className="rounded-md border border-amber-900/30 bg-amber-950/10 p-2.5 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold uppercase">
        <FileText size={10} />
        Plan Approval Required
      </div>
      {approval.body && (
        <pre className="text-[9px] text-muted-foreground max-h-24 overflow-y-auto whitespace-pre-wrap font-mono bg-secondary/30 rounded p-1.5">
          {approval.body}
        </pre>
      )}
      <div className="flex gap-1.5">
        <button className="flex-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 px-2 py-1 text-[10px] font-medium hover:bg-emerald-950/60 transition-colors">
          Approve & Build
        </button>
        <button className="flex-1 rounded bg-secondary text-foreground border border-border px-2 py-1 text-[10px] font-medium hover:bg-secondary/80 transition-colors">
          Edit Plan
        </button>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
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
        <h4 key={i} className="text-[11px] font-bold text-foreground mt-1.5 mb-0.5">
          {line.slice(2)}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h5 key={i} className="text-[10px] font-bold text-muted-foreground mt-1.5 mb-0.5">
          {line.slice(3)}
        </h5>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="text-[10px] text-muted-foreground ml-2.5">
          {line.slice(2)}
        </li>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="text-[10px] text-muted-foreground/60 border-l-2 border-border pl-2 my-0.5">
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="text-[10px] text-foreground my-0.5">
          {line}
        </p>
      );
    } else {
      elements.push(<div key={i} className="h-0.5" />);
    }
  }

  if (inCodeBlock && codeContent.length > 0) {
    elements.push(<CodeBlock key="end" lang={codeLang} content={codeContent.join("\n")} />);
  }

  return <div className="space-y-0">{elements}</div>;
}

function CodeBlock({ lang, content }: { lang: string; content: string }) {
  return (
    <div className="my-0.5 rounded overflow-hidden border border-border">
      {lang && (
        <div className="px-2 py-0.5 bg-secondary text-[9px] text-muted-foreground/60 uppercase">
          {lang}
        </div>
      )}
      <pre className="px-2 py-1 text-[9px] text-muted-foreground overflow-x-auto font-mono bg-card">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function looksLikeChangeRequest(content: string): boolean {
  const triggers = ["change", "edit", "modify", "add", "create", "build", "implement", "fix"];
  const lower = content.toLowerCase();
  return triggers.some((t) => lower.includes(t));
}
