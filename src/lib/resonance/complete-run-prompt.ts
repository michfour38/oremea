import { prisma } from "@/lib/prisma";

const EDIT_WINDOW_MS = 10 * 60 * 1000;

type CompletionRow = {
  id: string;
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
    await prisma.profiles.create({
      data: {
        id: userId,
        display_name: "New User",
        pathway: "discover",
        updated_at: new Date(),
      },
    });
  }

  const existing = await prisma.$queryRaw<CompletionRow[]>`
    SELECT "id", "created_at", "is_shared"
    FROM "prompt_completions"
    WHERE "run_id" = ${runId}::uuid
      AND "prompt_id" = ${promptId}::uuid
    LIMIT 1
  `;

  if (existing[0]) {
    if (!isWithinEditWindow(existing[0].created_at)) {
      throw new Error("The 10-minute edit window has closed.");
    }

    const updated = await prisma.$queryRaw<CompletionRow[]>`
      UPDATE "prompt_completions"
      SET
        "response" = ${response},
        "is_shared" = false,
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${existing[0].id}::uuid
        AND "run_id" = ${runId}::uuid
      RETURNING "id", "created_at", "is_shared"
    `;

    return {
      id: updated[0].id,
      isShared: updated[0].is_shared,
    };
  }

  const created = await prisma.$queryRaw<CompletionRow[]>`
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
    RETURNING "id", "created_at", "is_shared"
  `;

  return {
    id: created[0].id,
    isShared: created[0].is_shared,
  };
}
