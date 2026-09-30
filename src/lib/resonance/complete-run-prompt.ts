import { prisma } from "@/lib/prisma";

const EDIT_WINDOW_MS = 10 * 60 * 1000;
const EDIT_SAVE_GRACE_MS = 5 * 60 * 1000;
const EDIT_SAVE_WINDOW_MS = EDIT_WINDOW_MS + EDIT_SAVE_GRACE_MS;

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

function isWithinEditSaveWindow(createdAt: Date) {
  return Date.now() - createdAt.getTime() <= EDIT_SAVE_WINDOW_MS;
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

  // The edit control is offered for 10 minutes. Once someone has already
  // opened the editor, allow a short save grace so the form does not become
  // dead while they are typing. Exact-answer retries remain idempotent.
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
        "prompt_completions"."created_at" >= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
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

  if (existing[0] && !isWithinEditSaveWindow(existing[0].created_at)) {
    throw new Error("The 10-minute edit window has closed.");
  }

  throw new Error("This reflection could not be saved.");
}
