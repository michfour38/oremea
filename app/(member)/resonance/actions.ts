"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

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

import { getMemberWaveContext } from "../../../src/lib/wave/wave.service";
import { markWaveDayComplete } from "../../../src/lib/wave/wave.completion";

import {
  signalReaction,
  signalAnalyze,
  signalResonanceOnCompletion,
  signalDepthAlignment,
} from "../signals/signals.service";

export async function submitPromptAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const promptId = String(formData.get("promptId") ?? "");
  const response = String(formData.get("response") ?? "").trim();
  const isShared = formData.get("isShared") === "true";
  const pathwayTransition = String(formData.get("pathwayTransition") ?? "").trim();

  if (!promptId || !response) return;

  await completePrompt(promptId, userId, response, isShared);

  try {
    if (pathwayTransition === "discover_to_relate") {
      await prisma.profiles.update({
        where: { id: userId },
        data: { pathway: "relate" },
      });
    }

    if (pathwayTransition === "relate_to_discover") {
      await prisma.profiles.update({
        where: { id: userId },
        data: { pathway: "discover" },
      });
    }
  } catch (error) {
    console.error("Pathway update failed:", error);
  }

  try {
    const context = await getMemberWaveContext(userId);

    if (
      context.progression.phase === "CORE" ||
      context.progression.phase === "INTEGRATION"
    ) {
      await markWaveDayComplete({
        userId,
        cohortId: context.wave.id,
        weekNumber: context.progression.weekNumber!,
        dayNumber: context.progression.dayNumber!,
      });
    }
  } catch (error) {
    console.error("Wave completion side effects failed:", error);
  }

  try {
    signalResonanceOnCompletion(userId, promptId, response);
    signalDepthAlignment(userId, promptId, response);
  } catch (error) {
    console.error("Signal side effects failed:", error);
  }

  revalidatePath("/resonance");
  redirect("/resonance");
}

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

export async function continueJourneyDayAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const weekNumber = Number(formData.get("weekNumber"));
  const dayNumber = Number(formData.get("dayNumber"));

  if (!weekNumber || !dayNumber) return;

  await prisma.journey_day_continues.upsert({
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
