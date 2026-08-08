"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { completeRunPrompt } from "@/src/lib/resonance/complete-run-prompt";
import {
  getRunActiveDay,
  getRunGuidance,
  getRunMirror,
  getRunPromptCompletions,
} from "@/src/lib/resonance/resonance-run-data";
import {
  completeResonanceRun,
  getActiveResonanceRun,
} from "@/src/lib/resonance/resonance-week-run";

async function assertActiveDay(
  userId: string,
  weekNumber: number,
  dayNumber: number,
) {
  const activeRun = await getActiveResonanceRun(userId);

  if (!activeRun || activeRun.weekNumber !== weekNumber) {
    throw new Error("This Resonance room is no longer the active visit.");
  }

  const currentDay = await getRunActiveDay(activeRun.id, weekNumber);
  if (currentDay !== dayNumber) {
    throw new Error("This Resonance day is no longer the active day.");
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

function assertGuidanceAnswered(
  guidance: Awaited<ReturnType<typeof getRunGuidance>>,
) {
  if (!guidance?.answerOne?.trim() || !guidance.answerTwo?.trim()) {
    throw new Error("Answer both of today's 2Q before continuing.");
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

function promptSaveMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  const safeMessages = new Set([
    "This Resonance room is no longer the active visit.",
    "This Resonance day is no longer the active day.",
    "This Resonance reflection is not available.",
    "The 10-minute edit window has closed.",
  ]);

  if (safeMessages.has(message)) return message;

  return "Your reflection reached Resonance, but the save record could not be written. Refresh the page and submit it again.";
}

export async function submitPromptAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const promptId = String(formData.get("promptId") ?? "");
  const response = String(formData.get("response") ?? "").trim();

  if (!promptId || !response) {
    return { ok: false, error: "Write a reflection before continuing." };
  }

  try {
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

    if (
      !prompt?.is_published ||
      !prompt.resonance_days.resonance_weeks.is_published
    ) {
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

    revalidatePath("/resonance");
    return { ok: true };
  } catch (error) {
    console.error("Resonance reflection save failed on server:", {
      userId,
      promptId,
      error,
    });

    return { ok: false, error: promptSaveMessage(error) };
  }
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
  assertGuidanceAnswered(guidance);

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

  assertGuidanceAnswered(guidance);

  if (!mirror || mirror.tier !== "full") {
    throw new Error("Open the closing Mirror before completing this visit.");
  }

  await continueRunDay({
    runId: activeRun.id,
    userId,
    weekNumber,
    dayNumber: 7,
  });

  await completeResonanceRun(userId, activeRun.id);

  revalidatePath("/entry");
  revalidatePath("/resonance");
  revalidatePath("/resonance/archive");
  redirect("/entry");
}
