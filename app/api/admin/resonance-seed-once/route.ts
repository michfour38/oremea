import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyResonanceSeed } from "@/prisma/scripts/resonance-verify-lib";
import { seedAllResonance } from "@/prisma/seeds/resonance-seed-lib";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPOSITORY = "michfour38/oremea";
const WORKFLOW_NAME = "Run Resonance production seed";

type GitHubWorkflowRun = {
  name?: string;
  event?: string;
  head_branch?: string;
  head_sha?: string;
  repository?: { full_name?: string };
};

async function requestIsAuthorized(request: Request) {
  const authorization = request.headers.get("authorization");
  const runId = request.headers.get("x-github-run-id");

  if (!authorization?.startsWith("Bearer ") || !runId || !/^\d+$/.test(runId)) {
    return false;
  }

  const response = await fetch(
    `https://api.github.com/repos/${REPOSITORY}/actions/runs/${runId}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: authorization,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) return false;

  const run = (await response.json()) as GitHubWorkflowRun;
  const deployedSha = process.env.RAILWAY_GIT_COMMIT_SHA;

  return (
    run.repository?.full_name === REPOSITORY &&
    run.name === WORKFLOW_NAME &&
    run.event === "push" &&
    run.head_branch === "main" &&
    (!deployedSha || run.head_sha === deployedSha)
  );
}

export async function GET(request: Request) {
  if (!(await requestIsAuthorized(request))) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    await seedAllResonance(prisma);
    const verification = await verifyResonanceSeed(prisma);

    return NextResponse.json({
      ok: true,
      expectedPromptCount: verification.expectedPromptCount,
      activePromptCount: verification.activePromptCount,
      rooms: verification.roomSummaries,
    });
  } catch (error) {
    console.error("One-time Resonance production seed failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown seed error",
      },
      { status: 500 },
    );
  }
}
