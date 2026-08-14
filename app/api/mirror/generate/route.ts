import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-run";
import {
  getRunGuidance,
  getRunMirror,
} from "@/src/lib/resonance/resonance-run-data";
import { runResonanceRunWeeklyMirror } from "@/src/lib/resonance/resonance-run-weekly-mirror";

const RESONANCE_URL =
  process.env.NEXT_PUBLIC_RESONANCE_URL || "https://resonance.oremea.com";

function resonanceRedirect(path: string) {
  return NextResponse.redirect(new URL(path, RESONANCE_URL));
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return resonanceRedirect("/sign-in");
  }

  const url = new URL(request.url);
  const weekNumber = Number(url.searchParams.get("weekNumber") ?? "0");
  const dayNumber = Number(url.searchParams.get("dayNumber") ?? "0");

  if (!weekNumber || dayNumber !== 7) {
    return resonanceRedirect("/resonance?mirror=invalid#mirror");
  }

  const activeRun = await getActiveResonanceRun(userId);
  if (!activeRun || activeRun.weekNumber !== weekNumber) {
    return resonanceRedirect("/resonance?mirror=invalid#mirror");
  }

  const guidance = await getRunGuidance(activeRun.id, 7);

  if (!guidance?.answerOne?.trim() || !guidance.answerTwo?.trim()) {
    return resonanceRedirect("/resonance?mirror=answers-required#mirror");
  }

  const existing = await getRunMirror(activeRun.id, 7);

  if (existing?.tier === "full") {
    return resonanceRedirect("/resonance?mirror=success#mirror");
  }

  const result = await runResonanceRunWeeklyMirror(userId, weekNumber, 7);

  if (!result) {
    return resonanceRedirect("/resonance?mirror=error#mirror");
  }

  return resonanceRedirect("/resonance?mirror=success#mirror");
}
