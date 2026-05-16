import { NextResponse } from "next/server";
import { Octokit } from "octokit";

export async function POST(request: Request) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GitHub token not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { owner, repo, branch, base = "main" } = body;
    if (!owner || !repo || !branch) {
      return NextResponse.json({ error: "owner, repo, and branch are required" }, { status: 400 });
    }

    const octokit = new Octokit({ auth: token });
    const baseRef = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${base}`,
    });
    const created = await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: baseRef.data.object.sha,
    });
    return NextResponse.json({ branch, ref: created.data.ref, sha: created.data.object.sha });
  } catch (error: any) {
    if (error.status === 422) {
      return NextResponse.json({ error: "Branch already exists or input is invalid" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
