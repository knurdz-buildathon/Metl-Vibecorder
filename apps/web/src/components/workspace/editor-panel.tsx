"use client";

import { FileText, GitBranch, Image, Monitor } from "lucide-react";
import { useState } from "react";

interface EditorPanelProps {
  workspaceUrl?: string;
}

export default function EditorPanel({ workspaceUrl }: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center h-9 px-2 bg-zinc-900 border-b border-zinc-800 gap-1">
        <TabButton
          active={activeTab === "editor"}
          icon={<FileText size={14} />}
          label="OpenVSCode"
          onClick={() => setActiveTab("editor")}
        />
        <TabButton
          active={activeTab === "preview"}
          icon={<Monitor size={14} />}
          label="Preview"
          onClick={() => setActiveTab("preview")}
        />
      </div>

      <div className="flex-1">
        {activeTab === "editor" && (
          <div className="w-full h-full">
            {workspaceUrl ? (
              <iframe
                src={workspaceUrl}
                className="w-full h-full border-0"
                title="OpenVSCode Server"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
                <FileText size={48} className="text-zinc-700" />
                <p className="text-sm">No workspace active.</p>
                <p className="text-xs text-zinc-600">
                  Start a session to open the OpenVSCode editor.
                </p>
              </div>
            )}
          </div>
        )}
        {activeTab === "preview" && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
            <Monitor size={48} className="text-zinc-700" />
            <p className="text-sm">Preview not available.</p>
            <p className="text-xs text-zinc-600">
              Preview will appear here when the app is running.
            </p>
          </div>
        )}
      </div>
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
      className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded ${
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
