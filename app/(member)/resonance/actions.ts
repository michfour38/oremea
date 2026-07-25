"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  activateResonanceWeek,
  completeResonanceWeek,
} from "@/src/lib/resonance/resonance-week-state";
import {
  completeResonanceRun,
  getActiveResonanceRun,
} from "@/src/lib/resonance/resonance-week-run";
import {
  getRunContinuedDays,
  getRunGuidance,
  getRunMirror,
  getRunPromptCompletions,
} from "@/src/lib/resonance/resonance-run-data";
import { completeRunPrompt } from "@/src/lib/resonance/complete-run-prompt";

import {
  toggleWitness,
  toggleResonated,
  upsertAnalysis,
  requestAnalysisPublic,
  withdrawAnalysisPublicRequest,
  approveAnalysisPublic,
  declineAnalysisPublic,
  makeAnalysisPrivateAgain,
} from "./resonance.service";

import {
  signalReaction,
  signalAnalyze,
  signalResonanceOnCompletion,
  signalDepthAlignment,
} from "../signals/signals.service";

async function getCurrentActiveDay(runId: string) {
  const completedDays = await getRunContinuedDays(runId);

  for (let dayNumber = 1; dayNumber <= 7; dayNumber += 1) {
    if (!completedDays.has(dayNumber)) return dayNumber;
  }

  return null;
}

async function assertActiveDay(
  userId: string,
  weekNumber: number,
  dayNumber: number,
) {
  const activeRun = await getActiveResonanceRun(userId);

  if (!activeRun || activeRun.weekNumber !== weekNumber) {
    throw new Error("This Resonance week is not active.");
  }

  const currentDay = await getCurrentActiveDay(activeRun.id);
  if (currentDay !== dayNumber) {
    throw new Error("This Resonance day is not currently active.");
  }

  return activeRun;
}

async function assertAllDayReflectionsComplete(
  runId: string,
  weekNumber: number,
  dayNumber: number,
) {
  const day = await prisma.resonance_days.findFirst({
    where: {
      day_number: dayNumber,
      resonance_weeks: {
        week_number: weekNumber,
        is_published: true,
      },
    },
    select: {
      day_prompts: {
        where: { is_published: true },
        select: { id: true },
      },
    },
  });

  if (!day || day.day_prompts.length === 0) {
    throw new Error("This Resonance day is not available.");
  }

  const promptIds = day.day_prompts.map((prompt) => prompt.id);
  const completions = await getRunPromptCompletions(runId, promptIds);

  if (promptIds.some((promptId) => !completions.has(promptId))) {
    throw new Error("Complete today's reflections before continuing.");
  }
}

async function continueRunDay(params: {
  runId: string;
  userId: string;
  weekNumber: number;
  dayNumber: number;
}) {
  const { runId, userId, weekNumber, dayNumber } = params;

  await prisma.$executeRaw`
    INSERT INTO "journey_day_continues" (
      "user_id",
      "week_number",
      "day_number",
      "run_id",
      "continued_at",
      "created_at"
    )
    VALUES (
      ${userId},
      ${weekNumber},
      ${dayNumber},
      ${runId}::uuid,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("run_id", "day_number")
    DO UPDATE SET "continued_at" = CURRENT_TIMESTAMP
  `;
}

export async function activateResonanceWeekAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const weekNumber = Number(formData.get("weekNumber"));
  if (!weekNumber) return;

  // Kept temporarily for legacy access while the purchase entry point is
  // migrated to create a Resonance run directly.
  await activateResonanceWeek(userId, weekNumber);

  revalidatePath("/entry");
  revalidatePath("/resonance");
  redirect("/resonance");
}

export async function submitPromptAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const promptId = String(formData.get("promptId") ?? "");
  const response = String(formData.get("response") ?? "").trim();

  if (!promptId || !response) return;

  const prompt = await prisma.day_prompts.findUnique({
    where: { id: promptId },
    select: {
      is_published: true,
      resonance_days: {
        select: {
          day_number: true,
          resonance_weeks: {
            select: {
              week_number: true,
              is_published: true,
            },
          },
        },
      },
    },
  });

  if (!prompt?.is_published || !prompt.resonance_days.resonance_weeks.is_published) {
    throw new Error("This Resonance reflection is not available.");
  }

  const weekNumber = prompt.resonance_days.resonance_weeks.week_number;
  const dayNumber = prompt.resonance_days.day_number;
  const activeRun = await assertActiveDay(userId, weekNumber, dayNumber);

  await completeRunPrompt({
    promptId,
    userId,
    runId: activeRun.id,
    response,
  });

  try {
    signalResonanceOnCompletion(userId, promptId, response);
    signalDepthAlignment(userId, promptId, response);
  } catch (error) {
    console.error("Signal side effects failed:", error);
  }

  revalidatePath("/resonance");
  redirect("/resonance");
}

// Legacy social actions remain available only for historical data/components.
// The active Resonance journey no longer exposes or calls them.
export async function toggleWitnessAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const completionId = String(formData.get("completionId"));
  if (!completionId) return;

  await toggleWitness(completionId, userId);
  signalReaction(userId, completionId, "witness");

  revalidatePath("/resonance");
}

export async function toggleResonatedAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const completionId = String(formData.get("completionId"));
  if (!completionId) return;

  await toggleResonated(completionId, userId);
  signalReaction(userId, completionId, "resonated");

  revalidatePath("/resonance");
}

export async function submitAnalysisAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const completionId = String(formData.get("completionId"));
  const content = String(formData.get("content") ?? "").trim();

  if (!completionId || !content) return;

  await upsertAnalysis(completionId, userId, content);
  signalAnalyze(userId, completionId);

  revalidatePath("/resonance");
}

export async function requestAnalysisPublicAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const analysisId = String(formData.get("analysisId"));
  if (!analysisId) return;

  await requestAnalysisPublic(analysisId, userId);
  revalidatePath("/resonance");
}

export async function withdrawAnalysisPublicRequestAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const analysisId = String(formData.get("analysisId"));
  if (!analysisId) return;

  await withdrawAnalysisPublicRequest(analysisId, userId);
  revalidatePath("/resonance");
}

export async function approveAnalysisPublicAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const analysisId = String(formData.get("analysisId"));
  if (!analysisId) return;

  await approveAnalysisPublic(analysisId, userId);
  revalidatePath("/resonance");
}

export async function declineAnalysisPublicAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const analysisId = String(formData.get("analysisId"));
  if (!analysisId) return;

  await declineAnalysisPublic(analysisId, userId);
  revalidatePath("/resonance");
}

export async function makeAnalysisPrivateAgainAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const analysisId = String(formData.get("analysisId"));
  if (!analysisId) return;

  await makeAnalysisPrivateAgain(analysisId, userId);
  revalidatePath("/resonance");
}

export async function updatePathwayAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const pathway = String(formData.get("pathway") ?? "").trim();

  if (pathway !== "discover" && pathway !== "relate") return;

  await prisma.profiles.update({
    where: { id: userId },
    data: { pathway },
  });

  revalidatePath("/resonance");
}

export async function continueResonanceDayAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const weekNumber = Number(formData.get("weekNumber"));
  const dayNumber = Number(formData.get("dayNumber"));

  if (!weekNumber || !dayNumber || dayNumber < 1 || dayNumber > 6) return;

  const activeRun = await assertActiveDay(userId, weekNumber, dayNumber);
  await assertAllDayReflectionsComplete(activeRun.id, weekNumber, dayNumber);

  const guidance = await getRunGuidance(activeRun.id, dayNumber);
  if (!guidance) {
    throw new Error("Complete today's 2Q before continuing.");
  }

  await continueRunDay({
    runId: activeRun.id,
    userId,
    weekNumber,
    dayNumber,
  });

  revalidatePath("/resonance");
  redirect("/resonance");
}

export async function completeResonanceWeekAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const weekNumber = Number(formData.get("weekNumber"));
  if (!weekNumber) return;

  const activeRun = await assertActiveDay(userId, weekNumber, 7);
  await assertAllDayReflectionsComplete(activeRun.id, weekNumber, 7);

  const [guidance, mirror] = await Promise.all([
    getRunGuidance(activeRun.id, 7),
    getRunMirror(activeRun.id, 7),
  ]);

  if (!guidance) {
    throw new Error("Complete Day 7's 2Q before completing the week.");
  }

  if (!mirror || mirror.tier !== "full") {
    throw new Error("Open the weekly Mirror before completing the week.");
  }

  await continueRunDay({
    runId: activeRun.id,
    userId,
    weekNumber,
    dayNumber: 7,
  });

  await completeResonanceRun(userId, activeRun.id);

  // Keep the legacy entitlement ledger synchronized until /entry purchase
  // selection is moved fully onto run purchases.
  await completeResonanceWeek(userId, weekNumber);

  revalidatePath("/entry");
  revalidatePath("/resonance");
  revalidatePath("/resonance/archive");
  redirect("/entry");
}
