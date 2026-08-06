import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyResonanceSeed } from "@/prisma/scripts/resonance-verify-lib";
import { seedResonanceWeek } from "@/prisma/seeds/resonance-seed-lib";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RELEASE_DEADLINE = Date.parse("2026-08-06T20:00:00Z");
let releaseComplete = false;

function requestIsAuthorized(request: Request) {
  const suppliedSha = request.headers.get("x-oremea-release-sha");
  const deployedSha = process.env.RAILWAY_GIT_COMMIT_SHA;

  return Boolean(
    !releaseComplete &&
      Date.now() <= RELEASE_DEADLINE &&
      suppliedSha &&
      deployedSha &&
      suppliedSha === deployedSha,
  );
}

export async function POST(request: Request) {
  if (!requestIsAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const url = new URL(request.url);
  const phase = url.searchParams.get("phase");

  try {
    if (phase === "ready") {
      return NextResponse.json({ ok: true, phase: "ready" });
    }

    if (phase === "seed") {
      const weekNumber = Number(url.searchParams.get("week"));

      if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 10) {
        return NextResponse.json(
          { ok: false, error: "Week must be an integer from 1 to 10" },
          { status: 400 },
        );
      }

      await seedResonanceWeek(prisma, weekNumber);

      return NextResponse.json({
        ok: true,
        phase: "seed",
        weekNumber,
      });
    }

    if (phase === "verify") {
      const verification = await verifyResonanceSeed(prisma);

      return NextResponse.json({
        ok: true,
        phase: "verify",
        expectedPromptCount: verification.expectedPromptCount,
        activePromptCount: verification.activePromptCount,
        rooms: verification.roomSummaries,
      });
    }

    if (phase === "close") {
      releaseComplete = true;
      return NextResponse.json({ ok: true, phase: "closed" });
    }

    return NextResponse.json(
      { ok: false, error: "Unknown release phase" },
      { status: 400 },
    );
  } catch (error) {
    console.error(`Resonance production release phase ${phase} failed:`, error);

    return NextResponse.json(
      {
        ok: false,
        phase,
        error: error instanceof Error ? error.message : "Unknown release error",
      },
      { status: 500 },
    );
  }
}