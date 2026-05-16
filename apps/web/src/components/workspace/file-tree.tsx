"use client";

import { useState, useEffect } from "react";
import { Folder, File, ChevronRight, ChevronDown, FolderOpen } from "lucide-react";

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
}

interface FileTreeProps {
  sessionId: string;
  onFileSelect?: (path: string) => void;
}

export default function FileTree({ sessionId, onFileSelect }: FileTreeProps) {
  const [files, setFiles] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/files`)
      .then((r) => r.json())
      .then((data) => {
        setFiles(data.files || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="text-zinc-500 text-xs text-center py-4">Loading files...</div>
    );
  }

  if (!files.length) {
    return (
      <div className="text-zinc-600 text-xs text-center py-4">No files yet.</div>
    );
  }

  return (
    <div className="text-xs text-zinc-300 overflow-y-auto">
      {files.map((node) => (
        <TreeNodeComponent
          key={node.path}
          node={node}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          onSelect={onFileSelect || (() => {})}
        />
      ))}
    </div>
  );
}

function TreeNodeComponent({
  node,
  depth,
  expanded,
  onToggle,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  const isExpanded = expanded.has(node.path);
  const hasChildren = node.children && node.children.length > 0;

  if (node.type === "file") {
    return (
      <div
        className="flex items-center gap-1 py-0.5 px-1 hover:bg-zinc-800 cursor-pointer rounded"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => onSelect(node.path)}
      >
        <File size={12} className="text-zinc-500 flex-shrink-0" />
        <span className="truncate text-zinc-300">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 px-1 hover:bg-zinc-800 cursor-pointer rounded"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => hasChildren && onToggle(node.path)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown size={12} className="text-zinc-500 flex-shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-zinc-500 flex-shrink-0" />
          )
        ) : (
          <span className="w-3" />
        )}
        {isExpanded ? (
          <FolderOpen size={12} className="text-zinc-400 flex-shrink-0" />
        ) : (
          <Folder size={12} className="text-zinc-500 flex-shrink-0" />
        )}
        <span className="truncate text-zinc-200 font-medium">{node.name}</span>
      </div>
      {isExpanded &&
        hasChildren &&
        node.children!.map((child) => (
          <TreeNodeComponent
            key={child.path}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
