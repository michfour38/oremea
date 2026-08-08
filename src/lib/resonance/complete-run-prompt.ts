import { prisma } from "@/lib/prisma";

const EDIT_WINDOW_MS = 10 * 60 * 1000;

type CompletionRow = {
  id: string;
  response: string;
  created_at: Date;
  is_shared: boolean;
};

export type CompleteRunPromptResult = {
  id: string;
  isShared: boolean;
};

function isWithinEditWindow(createdAt: Date) {
  return Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS;
}

export async function completeRunPrompt(params: {
  promptId: string;
  userId: string;
  runId: string;
  response: string;
}): Promise<CompleteRunPromptResult> {
  const { promptId, userId, runId, response } = params;

  const existingProfile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!existingProfile) {
    try {
      await prisma.profiles.create({
        data: {
          id: userId,
          display_name: "New User",
          pathway: "discover",
          updated_at: new Date(),
        },
      });
    } catch (error) {
      // Two first-time requests can race to create the same profile. If the
      // other request won, the profile now exists and this save may continue.
      const profileAfterRace = await prisma.profiles.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!profileAfterRace) throw error;
    }
  }

  // One atomic write handles first submission, a legitimate edit inside the
  // 10-minute window, browser/network retries, and accidental duplicate POSTs.
  // Retrying the exact same answer is always idempotent, even after the edit
  // window closes, so a successful save can never turn into a false failure.
  const saved = await prisma.$queryRaw<CompletionRow[]>`
    INSERT INTO "prompt_completions" (
      "prompt_id",
      "user_id",
      "run_id",
      "response",
      "is_shared",
      "created_at",
      "updated_at"
    )
    VALUES (
      ${promptId}::uuid,
      ${userId},
      ${runId}::uuid,
      ${response},
      false,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("prompt_id", "run_id")
    DO UPDATE SET
      "response" = EXCLUDED."response",
      "is_shared" = false,
      "updated_at" = CURRENT_TIMESTAMP
    WHERE "prompt_completions"."user_id" = EXCLUDED."user_id"
      AND (
        "prompt_completions"."created_at" >= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
        OR "prompt_completions"."response" = EXCLUDED."response"
      )
    RETURNING "id", "response", "created_at", "is_shared"
  `;

  if (saved[0]) {
    return {
      id: saved[0].id,
      isShared: saved[0].is_shared,
    };
  }

  const existing = await prisma.$queryRaw<CompletionRow[]>`
    SELECT "id", "response", "created_at", "is_shared"
    FROM "prompt_completions"
    WHERE "run_id" = ${runId}::uuid
      AND "prompt_id" = ${promptId}::uuid
    LIMIT 1
  `;

  if (existing[0] && !isWithinEditWindow(existing[0].created_at)) {
    throw new Error("The 10-minute edit window has closed.");
  }

  throw new Error("This reflection could not be saved.");
}
