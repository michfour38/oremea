import type { PrismaClient } from "@prisma/client";

import { RESONANCE_CONTENT } from "../seeds/resonance-content";

export type ResonanceVerificationResult = {
  expectedPromptCount: number;
  activePromptCount: number;
  roomSummaries: string[];
};

export async function verifyResonanceSeed(
  prisma: PrismaClient,
): Promise<ResonanceVerificationResult> {
  const errors: string[] = [];
  const roomSummaries: string[] = [];
  let activePromptCount = 0;

  const weeks = await prisma.resonance_weeks.findMany({
    where: { is_published: true },
    include: {
      rooms: true,
      resonance_days: {
        orderBy: { day_number: "asc" },
        include: {
          day_prompts: {
            where: { is_published: true },
            orderBy: [{ prompt_order: "asc" }, { created_at: "asc" }],
          },
        },
      },
    },
    orderBy: { week_number: "asc" },
  });

  const expectedNumbers = new Set(
    RESONANCE_CONTENT.map((week) => week.week_number),
  );

  for (const actual of weeks) {
    if (!expectedNumbers.has(actual.week_number)) {
      errors.push(`Unexpected published week ${actual.week_number}`);
    }
  }

  for (const expected of RESONANCE_CONTENT) {
    const actual = weeks.find(
      (week) => week.week_number === expected.week_number,
    );

    if (!actual) {
      errors.push(`Missing published Week ${expected.week_number}`);
      continue;
    }

    const metadataChecks: Array<[string, unknown, unknown]> = [
      ["week title", actual.title, expected.title],
      ["week theme", actual.theme, expected.theme],
      ["room slug", actual.rooms.slug, expected.slug],
      ["room name", actual.rooms.name, expected.title],
      ["room theme", actual.rooms.theme, expected.theme],
      ["room number", actual.rooms.week_number, expected.week_number],
      ["integration flag", actual.rooms.is_integration, expected.is_integration],
    ];

    for (const [label, found, wanted] of metadataChecks) {
      if (found !== wanted) {
        errors.push(
          `Week ${expected.week_number} ${label} mismatch: expected ${JSON.stringify(wanted)}, found ${JSON.stringify(found)}`,
        );
      }
    }

    const actualDayNumbers = actual.resonance_days.map(
      (day) => day.day_number,
    );
    const expectedDayNumbers = expected.days.map((day) => day.day_number);

    if (actualDayNumbers.join(",") !== expectedDayNumbers.join(",")) {
      errors.push(
        `Week ${expected.week_number} day set mismatch: expected ${expectedDayNumbers.join(",")}, found ${actualDayNumbers.join(",")}`,
      );
    }

    for (const expectedDay of expected.days) {
      const actualDay = actual.resonance_days.find(
        (day) => day.day_number === expectedDay.day_number,
      );

      if (!actualDay) {
        errors.push(
          `Week ${expected.week_number} Day ${expectedDay.day_number} missing`,
        );
        continue;
      }

      activePromptCount += actualDay.day_prompts.length;

      if (actualDay.day_prompts.length !== expectedDay.prompts.length) {
        errors.push(
          `Week ${expected.week_number} Day ${expectedDay.day_number} prompt count: expected ${expectedDay.prompts.length}, found ${actualDay.day_prompts.length}`,
        );
      }

      for (const expectedPrompt of expectedDay.prompts) {
        const matches = actualDay.day_prompts.filter(
          (prompt) => prompt.prompt_order === expectedPrompt.prompt_order,
        );

        if (matches.length !== 1) {
          errors.push(
            `Week ${expected.week_number} Day ${expectedDay.day_number} order ${expectedPrompt.prompt_order} active count: expected 1, found ${matches.length}`,
          );
          continue;
        }

        const actualPrompt = matches[0];

        if (
          actualPrompt.type !== expectedPrompt.type ||
          actualPrompt.label !== expectedPrompt.label ||
          actualPrompt.content !== expectedPrompt.content
        ) {
          errors.push(
            `Week ${expected.week_number} Day ${expectedDay.day_number} prompt ${expectedPrompt.prompt_order} mismatch`,
          );
        }
      }

      for (const actualPrompt of actualDay.day_prompts) {
        if (
          !expectedDay.prompts.some(
            (prompt) => prompt.prompt_order === actualPrompt.prompt_order,
          )
        ) {
          errors.push(
            `Week ${expected.week_number} Day ${expectedDay.day_number} unexpected active order ${actualPrompt.prompt_order}`,
          );
        }
      }
    }

    roomSummaries.push(
      `PASS  ${expected.title.padEnd(16)} 7 days · 35 prompts exact`,
    );
  }

  const expectedPrompts = RESONANCE_CONTENT.flatMap((week) =>
    week.days.flatMap((day) => day.prompts),
  );
  const expectedPromptCount = expectedPrompts.length;
  const wording = expectedPrompts.map((prompt) => prompt.content);

  if (new Set(wording).size !== wording.length) {
    errors.push("Canonical source contains duplicate prompt wording");
  }

  if (activePromptCount !== expectedPromptCount) {
    errors.push(
      `Active prompt total: expected ${expectedPromptCount}, found ${activePromptCount}`,
    );
  }

  if (errors.length > 0) {
    throw new Error(`Resonance seed verification failed:\n- ${errors.join("\n- ")}`);
  }

  return { expectedPromptCount, activePromptCount, roomSummaries };
}
