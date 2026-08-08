import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { completeRunPrompt } from "@/src/lib/resonance/complete-run-prompt";
import { getRunContinuedDays } from "@/src/lib/resonance/resonance-run-data";
import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-run";

async function getCurrentActiveDay(runId: string) {
  const completedDays = await getRunContinuedDays(runId);

  for (let dayNumber = 1; dayNumber <= 7; dayNumber += 1) {
    if (!completedDays.has(dayNumber)) return dayNumber;
  }

  return null;
}

function safeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  const safeMessages = new Set([
    "This Resonance room is no longer the active visit.",
    "This Resonance day is no longer the active day.",
    "This Resonance reflection is not available.",
    "The 10-minute edit window has closed.",
  ]);

  if (safeMessages.has(message)) return message;

  return "This reflection could not be saved. Please try again.";
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Your session has expired. Refresh and sign in again." },
      { status: 401 },
    );
  }

  let body: { promptId?: unknown; response?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "This reflection could not be read. Please try again." },
      { status: 400 },
    );
  }

  const promptId = typeof body.promptId === "string" ? body.promptId : "";
  const response = typeof body.response === "string" ? body.response.trim() : "";

  if (!promptId || !response) {
    return NextResponse.json(
      { ok: false, error: "Write a reflection before continuing." },
      { status: 400 },
    );
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
    const activeRun = await getActiveResonanceRun(userId);

    if (!activeRun || activeRun.weekNumber !== weekNumber) {
      throw new Error("This Resonance room is no longer the active visit.");
    }

    const currentDay = await getCurrentActiveDay(activeRun.id);

    if (currentDay !== dayNumber) {
      throw new Error("This Resonance day is no longer the active day.");
    }

    await completeRunPrompt({
      promptId,
      userId,
      runId: activeRun.id,
      response,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resonance reflection API save failed:", {
      userId,
      promptId,
      error,
    });

    return NextResponse.json(
      { ok: false, error: safeMessage(error) },
      { status: 500 },
    );
  }
}
