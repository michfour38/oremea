"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  activateResonanceWeek,
  completeResonanceWeek,
  getResonanceWeekState,
} from "@/src/lib/resonance/resonance-week-state";

import {
  completePrompt,
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

async function getCurrentActiveDay(userId: string, weekNumber: number) {
  const continues = await prisma.resonance_day_continues.findMany({
    where: {
      user_id: userId,
      week_number: weekNumber,
    },
    select: { day_number: true },
  });

  const completedDays = new Set(continues.map((row) => row.day_number));

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
  const state = await getResonanceWeekState(userId);
  if (state.activeWeek !== weekNumber) {
    throw new Error("This Resonance week is not active.");
  }

  const currentDay = await getCurrentActiveDay(userId, weekNumber);
  if (currentDay !== dayNumber) {
    throw new Error("This Resonance day is not currently active.");
  }
}

async function assertAllDayReflectionsComplete(
  userId: string,
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
        select: {
          id: true,
          prompt_completions: {
            where: { user_id: userId },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!day || day.day_prompts.length === 0) {
    throw new Error("This Resonance day is not available.");
  }

  const allComplete = day.day_prompts.every(
    (prompt) => prompt.prompt_completions.length > 0,
  );

  if (!allComplete) {
    throw new Error("Complete today's reflections before continuing.");
  }
}

export async function activateResonanceWeekAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const weekNumber = Number(formData.get("weekNumber"));
  if (!weekNumber) return;

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

  await assertActiveDay(userId, weekNumber, dayNumber);
  await completePrompt(promptId, userId, response, false);

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

  await assertActiveDay(userId, weekNumber, dayNumber);
  await assertAllDayReflectionsComplete(userId, weekNumber, dayNumber);

  const guidance = await prisma.resonance_day_guidance.findUnique({
    where: {
      user_id_week_number_day_number: {
        user_id: userId,
        week_number: weekNumber,
        day_number: dayNumber,
      },
    },
    select: { id: true },
  });

  if (!guidance) {
    throw new Error("Complete today's 2Q before continuing.");
  }

  await prisma.resonance_day_continues.upsert({
    where: {
      user_id_week_number_day_number: {
        user_id: userId,
        week_number: weekNumber,
        day_number: dayNumber,
      },
    },
    update: {
      continued_at: new Date(),
    },
    create: {
      user_id: userId,
      week_number: weekNumber,
      day_number: dayNumber,
    },
  });

  revalidatePath("/resonance");
  redirect("/resonance");
}

export async function completeResonanceWeekAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const weekNumber = Number(formData.get("weekNumber"));
  if (!weekNumber) return;

  await assertActiveDay(userId, weekNumber, 7);
  await assertAllDayReflectionsComplete(userId, weekNumber, 7);

  const [guidance, mirror] = await Promise.all([
    prisma.resonance_day_guidance.findUnique({
      where: {
        user_id_week_number_day_number: {
          user_id: userId,
          week_number: weekNumber,
          day_number: 7,
        },
      },
      select: { id: true },
    }),
    prisma.mirror_responses.findUnique({
      where: {
        user_id_week_number_day_number: {
          user_id: userId,
          week_number: weekNumber,
          day_number: 7,
        },
      },
      select: { id: true, tier: true },
    }),
  ]);

  if (!guidance) {
    throw new Error("Complete Day 7's 2Q before completing the week.");
  }

  if (!mirror || mirror.tier !== "full") {
    throw new Error("Open the weekly Mirror before completing the week.");
  }

  await prisma.resonance_day_continues.upsert({
    where: {
      user_id_week_number_day_number: {
        user_id: userId,
        week_number: weekNumber,
        day_number: 7,
      },
    },
    update: { continued_at: new Date() },
    create: {
      user_id: userId,
      week_number: weekNumber,
      day_number: 7,
    },
  });

  await completeResonanceWeek(userId, weekNumber);

  revalidatePath("/entry");
  revalidatePath("/resonance");
  revalidatePath("/resonance/archive");
  redirect("/entry");
}
