import { NextResponse } from "next/server";
import { Octokit } from "octokit";

export async function POST(request: Request) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GitHub token not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { owner, repo, head, base = "main", title, body: prBody, draft = true } = body;
    if (!owner || !repo || !head || !title) {
      return NextResponse.json({ error: "owner, repo, head, and title are required" }, { status: 400 });
    }

    const octokit = new Octokit({ auth: token });
    const pr = await octokit.rest.pulls.create({
      owner,
      repo,
      head,
      base,
      title,
      body: prBody,
      draft,
    });
    return NextResponse.json({
      number: pr.data.number,
      url: pr.data.html_url,
      draft: pr.data.draft,
      state: pr.data.state,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
