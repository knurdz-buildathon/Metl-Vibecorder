import {
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode,
  Folder,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  Terminal,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FileContentResponse, FileNode, FileTreeResponse, StreamEvent } from "../shared/types";

type LogLine = {
  id: number;
  kind: StreamEvent["type"] | "info";
  text: string;
};

const samplePrompt =
  "Create a polished Vite React TypeScript project dashboard for tracking build jobs. Include package.json, src files, CSS, and run npm install plus npm run build.";

export function App() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [workspaceRoot, setWorkspaceRoot] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [prompt, setPrompt] = useState(samplePrompt);
  const [model, setModel] = useState("composer-2");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    void refreshFiles();
    void fetch("/api/workspace")
      .then((response) => response.json())
      .then((data: { root: string; model: string }) => {
        setWorkspaceRoot(data.root);
        setModel(data.model);
      });
  }, []);

  const flattenedFiles = useMemo(() => flattenFiles(tree), [tree]);

  async function refreshFiles() {
    const response = await fetch("/api/files");
    const data = (await response.json()) as FileTreeResponse;
    setTree(data.tree);
    setWorkspaceRoot(data.root);

    if (!selectedPath && data.tree.length > 0) {
      const firstFile = findFirstFile(data.tree);
      if (firstFile) {
        await openFile(firstFile.path);
      }
    }
  }

  async function openFile(path: string) {
    const response = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      setFileContent(await response.text());
      setSelectedPath(path);
      return;
    }

    const data = (await response.json()) as FileContentResponse;
    setSelectedPath(path);
    setFileContent(data.content);
  }

  async function resetWorkspace() {
    setResetting(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      setTree([]);
      setSelectedPath("");
      setFileContent("");
      setLogs([{ id: Date.now(), kind: "info", text: "Workspace reset." }]);
      await refreshFiles();
    } finally {
      setResetting(false);
    }
  }

  async function runGeneration() {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || running) {
      return;
    }

    setRunning(true);
    setLogs([{ id: Date.now(), kind: "status", text: "Sending prompt to Cursor SDK..." }]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt, model })
      });

      if (!response.body) {
        throw new Error("No response stream received.");
      }

      await readEventStream(response.body, (event) => {
        if (event.type === "files") {
          setTree(event.tree);
          return;
        }

        if (event.type === "done") {
          addLog("done", `Finished with ${event.status} in ${formatDuration(event.durationMs)}.`);
          void refreshFiles();
          return;
        }

        if (event.type === "tool") {
          addLog("tool", `${event.status} ${event.name}`);
          return;
        }

        if (event.type === "assistant") {
          addLog("assistant", event.text);
          return;
        }

        addLog(event.type, "message" in event ? event.message : event.text);
      });
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
      await refreshFiles();
    }
  }

  function addLog(kind: LogLine["kind"], text: string) {
    if (!text.trim()) {
      return;
    }

    setLogs((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        kind,
        text
      }
    ]);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Code2 size={18} />
          </div>
          <div>
            <h1>Metl IDE Demo</h1>
            <p>{workspaceRoot || "generated workspace"}</p>
          </div>
        </div>
        <div className="topbar-actions">
          <label className="model-input">
            <span>Model</span>
            <input value={model} onChange={(event) => setModel(event.target.value)} />
          </label>
          <button className="icon-button" onClick={() => void refreshFiles()} title="Refresh files">
            <RefreshCw size={17} />
          </button>
          <button className="icon-button danger" onClick={() => void resetWorkspace()} disabled={resetting || running} title="Reset workspace">
            {resetting ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
          </button>
        </div>
      </header>

      <section className="ide-grid">
        <aside className="file-pane">
          <div className="pane-heading">
            <Folder size={16} />
            <span>Files</span>
            <small>{flattenedFiles.length}</small>
          </div>
          <div className="tree-list">
            {tree.length === 0 ? (
              <div className="empty-state">No files yet</div>
            ) : (
              tree.map((node) => (
                <FileTreeItem key={node.path} node={node} selectedPath={selectedPath} onSelect={(path) => void openFile(path)} />
              ))
            )}
          </div>
        </aside>

        <section className="editor-pane">
          <div className="pane-heading">
            <FileCode size={16} />
            <span>{selectedPath || "Preview"}</span>
          </div>
          <pre className="code-preview">
            <code>{fileContent || "Generated files will appear here."}</code>
          </pre>
        </section>

        <aside className="agent-pane">
          <div className="prompt-panel">
            <div className="pane-heading">
              <Sparkles size={16} />
              <span>Prompt</span>
            </div>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} spellCheck={false} />
            <button className="run-button" onClick={() => void runGeneration()} disabled={running || !prompt.trim()}>
              {running ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
              <span>{running ? "Building" : "Build Project"}</span>
            </button>
          </div>

          <div className="terminal-panel">
            <div className="pane-heading">
              <Terminal size={16} />
              <span>Agent</span>
            </div>
            <div className="logs">
              {logs.length === 0 ? (
                <div className="empty-state">Waiting</div>
              ) : (
                logs.map((line) => (
                  <div className={`log-line ${line.kind}`} key={line.id}>
                    <span>{line.kind}</span>
                    <p>{line.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function FileTreeItem({
  node,
  selectedPath,
  onSelect
}: {
  node: FileNode;
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const isDirectory = node.type === "directory";

  return (
    <div className="tree-item">
      <button
        className={`tree-row ${selectedPath === node.path ? "selected" : ""}`}
        onClick={() => (isDirectory ? setOpen((value) => !value) : onSelect(node.path))}
        title={node.path}
      >
        {isDirectory ? open ? <ChevronDown size={15} /> : <ChevronRight size={15} /> : <FileCode size={15} />}
        {isDirectory && <Folder size={15} />}
        <span>{node.name}</span>
      </button>
      {isDirectory && open && node.children && (
        <div className="tree-children">
          {node.children.map((child) => (
            <FileTreeItem key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap((node) => {
    if (node.type === "file") {
      return [node];
    }
    return flattenFiles(node.children ?? []);
  });
}

function findFirstFile(nodes: FileNode[]): FileNode | undefined {
  for (const node of nodes) {
    if (node.type === "file") {
      return node;
    }

    const child = findFirstFile(node.children ?? []);
    if (child) {
      return child;
    }
  }
  return undefined;
}

async function readEventStream(stream: ReadableStream<Uint8Array>, onEvent: (event: StreamEvent) => void) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const dataLine = part
        .split("\n")
        .find((line) => line.startsWith("data: "));

      if (!dataLine) {
        continue;
      }

      onEvent(JSON.parse(dataLine.slice("data: ".length)) as StreamEvent);
    }
  }
}

function formatDuration(ms: number) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}
