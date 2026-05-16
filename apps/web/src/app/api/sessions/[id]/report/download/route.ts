import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await prisma.finalReport.findUnique({ where: { sessionId: id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const markdown = report.markdown || [
      "# Final Report",
      "",
      `Readiness: ${report.readiness}`,
      `Files changed: ${report.filesChangedCount}`,
      `Checks: ${report.checksPassed} passed, ${report.checksFailed} failed, ${report.checksSkipped} skipped`,
      report.risks.length ? `Risks:\n${report.risks.map((risk) => `- ${risk}`).join("\n")}` : "Risks: none recorded",
    ].join("\n");

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="metlcode-report-${id}.md"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
