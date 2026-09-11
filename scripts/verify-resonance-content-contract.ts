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

console.log("Resonance content contract checks passed.");
