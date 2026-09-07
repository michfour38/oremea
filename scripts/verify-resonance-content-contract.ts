import assert from "node:assert/strict";

import { RESONANCE_CONTENT } from "../prisma/seeds/resonance-content";

const CURRENT_TEACHERS = [
  "The Hearth",
  "The Mirror",
  "The Garden",
  "The Bearing",
  "The Pulse",
  "The Shadow",
  "The Forge",
  "The Vision",
  "The Gathering",
  "The Becoming",
] as const;

assert.equal(
  RESONANCE_CONTENT.length,
  10,
  "Resonance must contain exactly ten independently sellable teacher rooms.",
);

const weekNumbers = RESONANCE_CONTENT.map((week) => week.week_number);
assert.deepEqual(
  weekNumbers,
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "Resonance teacher week numbers must remain stable from 1 through 10.",
);

assert.deepEqual(
  RESONANCE_CONTENT.map((week) => week.title),
  CURRENT_TEACHERS,
  "Resonance teacher names must remain on current authority.",
);

assert.equal(
  new Set(RESONANCE_CONTENT.map((week) => week.slug)).size,
  10,
  "Every Resonance teacher must have a unique commerce/content slug.",
);
assert.deepEqual(
  RESONANCE_CONTENT.map((week) => week.slug),
  [
    "hearth",
    "mirror",
    "garden",
    "bearing",
    "pulse",
    "shadow",
    "forge",
    "vision",
    "the-gathering",
    "the-becoming",
  ],
  "Resonance room slugs must name their own teachers and must not borrow a separate product identity.",
);

for (const week of RESONANCE_CONTENT) {
  assert.equal(
    week.days.length,
    7,
    `${week.title} must retain a complete seven-day room.`,
  );

  assert.ok(week.theme.trim(), `${week.title} must retain its teacher theme.`);

  for (const [index, day] of week.days.entries()) {
    assert.equal(
      day.day_number,
      index + 1,
      `${week.title} days must remain ordered 1 through 7.`,
    );
    assert.ok(
      day.prompts.length > 0,
      `${week.title} Day ${day.day_number} must contain participant prompts.`,
    );
    assert.equal(
      new Set(day.prompts.map((prompt) => prompt.prompt_order)).size,
      day.prompts.length,
      `${week.title} Day ${day.day_number} must not contain duplicate active prompt orders.`,
    );
    for (const prompt of day.prompts) {
      assert.ok(
        prompt.content.trim().length > 0,
        `${week.title} Day ${day.day_number} cannot contain an empty prompt.`,
      );
    }
  }
}

const allSeedText = JSON.stringify(RESONANCE_CONTENT);
assert.doesNotMatch(
  allSeedText,
  /The Compass|Integration I|Integration II/,
  "Superseded Resonance teacher names must not re-enter current seed authority.",
);

const roomText = Object.fromEntries(
  RESONANCE_CONTENT.map((week) => [
    week.title,
    week.days.flatMap((day) => day.prompts).map((prompt) => prompt.content).join("\n"),
  ]),
);

assert.doesNotMatch(
  roomText["The Bearing"],
  /what I will do next|action you could take next|when I will check again/i,
  "Bearing must reveal priorities and trade-offs without becoming Compass execution.",
);
assert.doesNotMatch(
  roomText["The Gathering"],
  /my next step is|easier to choose or do now/i,
  "Gathering must integrate or separate material without manufacturing a Compass next step.",
);
assert.doesNotMatch(
  roomText["The Becoming"],
  /simply lost the thread|within twenty-four hours/i,
  "Becoming must support lived continuation without productivity pressure or a mandatory deadline.",
);

console.log("Resonance content contract checks passed.");
