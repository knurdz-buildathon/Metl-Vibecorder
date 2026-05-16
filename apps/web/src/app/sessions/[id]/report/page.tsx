"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, ArrowLeft, FileText } from "lucide-react";

interface ReportData {
  session?: {
    id: string;
    mode: string;
    status: string;
    userPrompt: string;
    modelUsed: string;
    createdAt: string;
  };
  messages?: any[];
  checkRuns?: any[];
  agentRuns?: any[];
}

function useReport(sessionId: string) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/report`)
      .then((r) => r.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);
  return { report, loading };
}

function buildMarkdown(data: ReportData): string {
  const s = data.session!;
  let md = `# Session Report\n\n`;
  md += `**ID:** ${s.id}\n`;
  md += `**Mode:** ${s.mode}\n`;
  md += `**Status:** ${s.status}\n`;
  md += `**Model:** ${s.modelUsed}\n`;
  md += `**Created:** ${s.createdAt}\n\n`;
  md += `## Prompt\n\n${s.userPrompt}\n\n`;

  if (data.messages?.length) {
    md += `## Messages\n\n`;
    data.messages.forEach((m) => {
      md += `### ${m.role.toUpperCase()} (${m.mode || "-"})\n\n${m.content}\n\n`;
    });
  }

  if (data.agentRuns?.length) {
    md += `## Agent Runs\n\n`;
    data.agentRuns.forEach((a) => {
      md += `- **${a.mode}** (${a.succeeded ? "SUCCESS" : "FAILED"}) model=${a.model} | lat=${a.latencyMs || "-"}ms\n`;
    });
    md += `\n`;
  }

  if (data.checkRuns?.length) {
    md += `## Check Runs\n\n`;
    data.checkRuns.forEach((c) => {
      md += `- **${c.type}**: ${c.status}\n`;
      if (c.stderr) md += `  \`\`\`\n  ${c.stderr}\n  \`\`\`\n`;
    });
  }

  return md;
}

export default function SessionReportPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { report, loading } = useReport(sessionId);

  const handleDownload = () => {
    if (!report) return;
    const md = buildMarkdown(report);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${sessionId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-500">Loading report...</p>
      </div>
    );
  }

  if (!report?.session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-zinc-400">Report not found.</p>
          <Link href="/" className="text-white underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const md = buildMarkdown(report);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText size={22} />
            Session Report
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-200"
            >
              <Download size={16} />
              Download
            </button>
            <Link
              href={`/sessions/${sessionId}`}
              className="flex items-center gap-1 text-zinc-400 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
          </div>
        </div>

        <pre className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono">
          {md}
        </pre>
      </div>
    </div>
  );
}
