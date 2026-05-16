"use client";

import { useState } from "react";
import { FileText, Monitor, RefreshCw, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import type { IdeStatus, PreviewStatus } from "@/types";

interface EditorPanelProps {
  ideUrl?: string;
  ideStatus?: IdeStatus;
  previewUrl?: string;
  previewStatus?: PreviewStatus;
}

export default function EditorPanel({
  ideUrl,
  ideStatus = "disabled",
  previewUrl,
  previewStatus = "disabled",
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center h-8 px-2 bg-card border-b border-border gap-1">
        <TabButton
          active={activeTab === "editor"}
          icon={<FileText size={12} />}
          label="OpenVSCode"
          onClick={() => setActiveTab("editor")}
        />
        <TabButton
          active={activeTab === "preview"}
          icon={<Monitor size={12} />}
          label="Preview"
          onClick={() => setActiveTab("preview")}
        />
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === "editor" && (
          <IdeContent ideUrl={ideUrl} ideStatus={ideStatus} />
        )}
        {activeTab === "preview" && (
          <PreviewContent previewUrl={previewUrl} previewStatus={previewStatus} />
        )}
      </div>
    </div>
  );
}

function IdeContent({ ideUrl, ideStatus }: { ideUrl?: string; ideStatus: IdeStatus }) {
  if (ideStatus === "ready" && ideUrl) {
    return (
      <iframe
        src={ideUrl}
        className="w-full h-full border-0"
        title="OpenVSCode Server"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
      />
    );
  }

  if (ideStatus === "starting") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm">IDE is starting...</p>
        <p className="text-xs text-muted-foreground/60">This may take a few moments</p>
      </div>
    );
  }

  if (ideStatus === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <AlertTriangle size={32} className="text-destructive" />
        <p className="text-sm">IDE failed to start</p>
        <p className="text-xs text-muted-foreground/60 max-w-sm text-center">
          The IDE provider encountered an error. Your workspace is still available through logs, preview, and report panels.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 text-xs bg-secondary text-foreground px-3 py-1.5 rounded hover:bg-secondary/80 transition-colors"
        >
          <RotateCcw size={12} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <FileText size={32} className="text-muted-foreground/20" />
      <p className="text-sm">IDE provider is not configured</p>
      <p className="text-xs text-muted-foreground/60 max-w-sm text-center">
        Your workspace is still available through generated files, logs, preview, and report panels.
      </p>
    </div>
  );
}

function PreviewContent({ previewUrl, previewStatus }: { previewUrl?: string; previewStatus: PreviewStatus }) {
  if (previewStatus === "ready" && previewUrl) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-8 flex items-center justify-between px-2 bg-card border-b border-border">
          <span className="text-[10px] text-muted-foreground truncate max-w-[60%]">{previewUrl}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => window.location.reload()}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Refresh preview"
            >
              <RefreshCw size={10} />
            </button>
          </div>
        </div>
        <iframe
          src={previewUrl}
          className="flex-1 w-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  }

  if (previewStatus === "starting") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm">Preview is starting...</p>
      </div>
    );
  }

  if (previewStatus === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <AlertTriangle size={32} className="text-destructive" />
        <p className="text-sm">Preview failed to start</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 text-xs bg-secondary text-foreground px-3 py-1.5 rounded hover:bg-secondary/80 transition-colors"
        >
          <RotateCcw size={12} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <Monitor size={32} className="text-muted-foreground/20" />
      <p className="text-sm">Preview not available</p>
      <p className="text-xs text-muted-foreground/60 max-w-sm text-center">
        Preview will appear here when the app is running.
      </p>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] rounded transition-colors ${
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
