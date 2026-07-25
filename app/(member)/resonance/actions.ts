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

  const state = await getResonanceWeekState(userId);
  if (state.activeWeek !== weekNumber) {
    throw new Error("This Resonance week is not active.");
  }

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

  const state = await getResonanceWeekState(userId);
  if (state.activeWeek !== weekNumber) {
    throw new Error("This Resonance week is not active.");
  }

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
