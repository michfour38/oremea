import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { runResonanceWeeklyMirror } from "@/src/lib/resonance/resonance-weekly-mirror";
import { getResonanceWeekState } from "@/src/lib/resonance/resonance-week-state";

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

  const state = await getResonanceWeekState(userId);
  if (state.activeWeek !== weekNumber) {
    return NextResponse.redirect(`${APP_URL}/resonance?mirror=invalid#mirror`);
  }

  const guidance = await prisma.resonance_day_guidance.findUnique({
    where: {
      user_id_week_number_day_number: {
        user_id: userId,
        week_number: weekNumber,
        day_number: 7,
      },
    },
    select: { id: true },
  });

  if (!guidance) {
    return NextResponse.redirect(
      `${APP_URL}/resonance?mirror=questions-required#mirror`,
    );
  }

  const existing = await prisma.mirror_responses.findUnique({
    where: {
      user_id_week_number_day_number: {
        user_id: userId,
        week_number: weekNumber,
        day_number: 7,
      },
    },
    select: { tier: true },
  });

  if (existing?.tier === "full") {
    return NextResponse.redirect(`${APP_URL}/resonance?mirror=success#mirror`);
  }

  const result = await runResonanceWeeklyMirror(userId, weekNumber, 7);

  if (!result) {
    return NextResponse.redirect(`${APP_URL}/resonance?mirror=error#mirror`);
  }

  return NextResponse.redirect(`${APP_URL}/resonance?mirror=success#mirror`);
}
