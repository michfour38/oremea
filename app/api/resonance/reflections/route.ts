import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { completeRunPrompt } from "@/src/lib/resonance/complete-run-prompt";
import { getRunContinuedDays } from "@/src/lib/resonance/resonance-run-data";
import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-run";

const BUILD_SHA =
  process.env.RAILWAY_GIT_COMMIT_SHA ??
  process.env.GIT_COMMIT_SHA ??
  "unknown";

function json(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(
    {
      ...body,
      build: BUILD_SHA === "unknown" ? BUILD_SHA : BUILD_SHA.slice(0, 8),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

async function getCurrentActiveDay(runId: string) {
  const completedDays = await getRunContinuedDays(runId);

  for (let dayNumber = 1; dayNumber <= 7; dayNumber += 1) {
    if (!completedDays.has(dayNumber)) return dayNumber;
  }

  return null;
}

function failureDetails(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "This Resonance room is no longer the active visit.") {
    return { error: message, code: "ACTIVE_RUN", status: 409 };
  }

  if (message === "This Resonance day is no longer the active day.") {
    return { error: message, code: "ACTIVE_DAY", status: 409 };
  }

  if (message === "This Resonance reflection is not available.") {
    return { error: message, code: "PROMPT_UNAVAILABLE", status: 409 };
  }

  if (message === "The 10-minute edit window has closed.") {
    return { error: message, code: "EDIT_WINDOW", status: 409 };
  }

  const prismaError = error as {
    code?: unknown;
    meta?: { code?: unknown } | null;
  };

  const prismaCode =
    typeof prismaError?.code === "string" ? prismaError.code : "";
  const databaseCode =
    typeof prismaError?.meta?.code === "string" ? prismaError.meta.code : "";

  if (prismaCode === "P2010" && databaseCode) {
    return {
      error: "The reflection reached the database but its write contract is out of sync.",
      code: `DB_${databaseCode}`,
      status: 500,
    };
  }

  if (prismaCode === "P2003") {
    return {
      error: "The reflection reached the database but a linked record is missing.",
      code: "DB_FOREIGN_KEY",
      status: 500,
    };
  }

  if (prismaCode === "P2002") {
    return {
      error: "The reflection reached the database but collided with an existing save record.",
      code: "DB_UNIQUE",
      status: 500,
    };
  }

  return {
    error: "This reflection could not be saved. Please try again.",
    code: prismaCode ? `DB_${prismaCode}` : "SAVE_UNKNOWN",
    status: 500,
  };
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return json(
      {
        ok: false,
        error: "Your session has expired. Refresh and sign in again.",
        code: "AUTH",
      },
      401,
    );
  }

  let body: { promptId?: unknown; response?: unknown };

  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        error: "This reflection could not be read. Please try again.",
        code: "BODY",
      },
      400,
    );
  }

  const promptId = typeof body.promptId === "string" ? body.promptId : "";
  const response = typeof body.response === "string" ? body.response.trim() : "";

  if (!promptId || !response) {
    return json(
      {
        ok: false,
        error: "Write a reflection before continuing.",
        code: "EMPTY",
      },
      400,
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

    return json({ ok: true });
  } catch (error) {
    const failure = failureDetails(error);

    console.error("Resonance reflection API save failed:", {
      userId,
      promptId,
      code: failure.code,
      build: BUILD_SHA,
      error,
    });

    return json(
      {
        ok: false,
        error: failure.error,
        code: failure.code,
      },
      failure.status,
    );
  }
}
