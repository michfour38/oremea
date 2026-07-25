import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-run";
import {
  getRunGuidance,
  getRunMirror,
} from "@/src/lib/resonance/resonance-run-data";
import { runResonanceRunWeeklyMirror } from "@/src/lib/resonance/resonance-run-weekly-mirror";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.oremea.com";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(`${APP_URL}/sign-in`);
  }

  const url = new URL(request.url);
  const weekNumber = Number(url.searchParams.get("weekNumber") ?? "0");
  const dayNumber = Number(url.searchParams.get("dayNumber") ?? "0");

  if (!weekNumber || dayNumber !== 7) {
    return NextResponse.redirect(`${APP_URL}/resonance?mirror=invalid#mirror`);
  }

  const activeRun = await getActiveResonanceRun(userId);
  if (!activeRun || activeRun.weekNumber !== weekNumber) {
    return NextResponse.redirect(`${APP_URL}/resonance?mirror=invalid#mirror`);
  }

  const guidance = await getRunGuidance(activeRun.id, 7);

  if (!guidance) {
    return NextResponse.redirect(
      `${APP_URL}/resonance?mirror=questions-required#mirror`,
    );
  }

  const existing = await getRunMirror(activeRun.id, 7);

  if (existing?.tier === "full") {
    return NextResponse.redirect(`${APP_URL}/resonance?mirror=success#mirror`);
  }

  const result = await runResonanceRunWeeklyMirror(userId, weekNumber, 7);

  if (!result) {
    return NextResponse.redirect(`${APP_URL}/resonance?mirror=error#mirror`);
  }

  return NextResponse.redirect(`${APP_URL}/resonance?mirror=success#mirror`);
}
