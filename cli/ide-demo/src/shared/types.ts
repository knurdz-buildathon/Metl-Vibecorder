export type FileNode = {
  name: string;
  path: string;
  type: "directory" | "file";
  children?: FileNode[];
};

export type FileTreeResponse = {
  root: string;
  tree: FileNode[];
};

export type FileContentResponse = {
  path: string;
  content: string;
  size: number;
};

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "assistant"; text: string }
  | { type: "thinking"; text: string }
  | { type: "tool"; name: string; status: string }
  | { type: "files"; tree: FileNode[] }
  | { type: "done"; status: string; durationMs: number }
  | { type: "error"; message: string };
