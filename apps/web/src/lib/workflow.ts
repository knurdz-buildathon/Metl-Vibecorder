import { prisma } from "@/lib/db";
import { callAgentRepair, callAgentReview } from "@/lib/orchestrator";
import { publishEvent } from "@/lib/events";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview-customtools";
const DEFAULT_PROMPT_VERSION = "0.1.0";
const MAX_REPAIR_ATTEMPTS = Number(process.env.VIBECODER_MAX_REPAIR_ATTEMPTS || "2");

function normalizeOperation(operation: string) {
  if (operation === "create") return "created";
  if (operation === "modify") return "modified";
  if (operation === "delete") return "deleted";
  return ["created", "modified", "deleted"].includes(operation) ? operation : "modified";
}

function stringifyCommand(command: any): string {
  if (typeof command === "string") return command;
  if (command?.command) return String(command.command);
  return JSON.stringify(command);
}

export async function persistAgentResult(sessionId: string, mode: string, result: any) {
  await prisma.agentRun.create({
    data: {
      sessionId,
      mode: mode as any,
      model: result.model || DEFAULT_MODEL,
      promptVersion: result.prompt_version?.version || result.prompt_version || DEFAULT_PROMPT_VERSION,
      succeeded: result.status !== "error" && result.status !== "failed",
      error: result.error || null,
      endedAt: new Date(),
    },
  });

  const files = Array.isArray(result.files_changed) ? result.files_changed : [];
  for (const file of files) {
    const filePath = file.path || file.file_path;
    if (!filePath) continue;
    await prisma.fileChange.create({
      data: {
        sessionId,
        filePath,
        operation: normalizeOperation(file.operation) as any,
        diff: file.diff || null,
      },
    });
  }

  const checks = Array.isArray(result.check_results)
    ? result.check_results
    : Array.isArray(result.results)
      ? result.results
      : [];
  for (const check of checks) {
    await prisma.checkRun.create({
      data: {
        sessionId,
        type: check.type || "unknown",
        status: check.status || "skipped",
        command: check.command || "",
        stdout: check.stdout || "",
        stderr: check.stderr || check.error || "",
        summary: check.summary || null,
        error: check.error || null,
        durationMs: check.duration_ms || check.durationMs || null,
        artifacts: check.artifacts || undefined,
      },
    });
  }

  return { files, checks };
}

export function failedCheckLogs(result: any): string {
  const checks = Array.isArray(result.check_results)
    ? result.check_results
    : Array.isArray(result.results)
      ? result.results
      : [];
  return checks
    .filter((check: any) => check.status === "failed")
    .map((check: any) => [
      `[${check.type || "check"}] ${check.command || ""}`,
      check.stdout || "",
      check.stderr || check.error || "",
    ].join("\n"))
    .join("\n\n");
}

export async function runRepairLoop(session: any, initialResult: any) {
  let currentResult = initialResult;
  let logs = failedCheckLogs(initialResult);

  for (let attempt = 1; attempt <= MAX_REPAIR_ATTEMPTS && currentResult?.completion_status === "needs_repair"; attempt++) {
    publishEvent(session.id, "status_change", { status: "fixing", attempt });
    const repair = await callAgentRepair({
      session_id: session.id,
      repo_path: session.workspace?.repoPath || "",
      error_logs: logs || "Checks failed without logs.",
      attempt,
    });
    await persistAgentResult(session.id, "REPAIR", repair);
    currentResult = repair;
    logs = failedCheckLogs(repair);
    if (repair.fixed || repair.completion_status === "done") break;
  }

  return currentResult;
}

export async function createFinalReport(sessionId: string, lastResult: any) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      checkRuns: true,
      fileChanges: true,
      agentRuns: true,
    },
  });
  if (!session) return null;

  const checksPassed = session.checkRuns.filter((c) => c.status === "passed").length;
  const checksFailed = session.checkRuns.filter((c) => c.status === "failed").length;
  const checksSkipped = session.checkRuns.filter((c) => c.status === "skipped").length;
  const repairAttempts = session.agentRuns.filter((run) => run.mode === "REPAIR").length;
  const commandsRun = Array.isArray(lastResult?.commands_run)
    ? lastResult.commands_run.map(stringifyCommand)
    : [];
  const risks = Array.isArray(lastResult?.risks) ? lastResult.risks.map(String) : [];
  const readiness = checksFailed > 0 ? "needs_fix" : lastResult?.readiness || "ready_for_review";
  const markdown = [
    `# Final Report`,
    ``,
    `Prompt: ${session.userPrompt}`,
    `Mode: ${session.mode}`,
    `Model: ${session.modelUsed || DEFAULT_MODEL}`,
    `Files changed: ${session.fileChanges.length}`,
    `Checks: ${checksPassed} passed, ${checksFailed} failed, ${checksSkipped} skipped`,
    `Repair attempts: ${repairAttempts}`,
    `Readiness: ${readiness}`,
    risks.length ? `Risks:\n${risks.map((risk: string) => `- ${risk}`).join("\n")}` : `Risks: none recorded`,
  ].join("\n");

  return prisma.finalReport.upsert({
    where: { sessionId },
    create: {
      sessionId,
      originalPrompt: session.userPrompt,
      mode: session.mode,
      model: session.modelUsed || DEFAULT_MODEL,
      promptVersion: session.promptVersion || DEFAULT_PROMPT_VERSION,
      filesChangedCount: session.fileChanges.length,
      commandsRun,
      checksPassed,
      checksFailed,
      checksSkipped,
      repairAttempts,
      risks,
      readiness,
      nextSteps: lastResult?.next_steps ? JSON.stringify(lastResult.next_steps) : null,
      markdown,
    },
    update: {
      filesChangedCount: session.fileChanges.length,
      commandsRun,
      checksPassed,
      checksFailed,
      checksSkipped,
      repairAttempts,
      risks,
      readiness,
      nextSteps: lastResult?.next_steps ? JSON.stringify(lastResult.next_steps) : null,
      markdown,
    },
  });
}

export async function runReviewAndReport(session: any, result: any) {
  let finalResult = result;
  const filesChanged = await prisma.fileChange.findMany({
    where: { sessionId: session.id },
    select: { filePath: true },
  });

  if (filesChanged.length > 0) {
    try {
      publishEvent(session.id, "status_change", { status: "repo_analyzing" });
      const review = await callAgentReview({
        session_id: session.id,
        repo_path: session.workspace?.repoPath || "",
        files_changed: filesChanged.map((f) => f.filePath),
      });
      await persistAgentResult(session.id, "REVIEW", review);
      finalResult = review;
    } catch (error: any) {
      publishEvent(session.id, "agent_error", { error: `Review skipped: ${error.message}` });
    }
  }

  await createFinalReport(session.id, finalResult);
  return finalResult;
}
