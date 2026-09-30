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

const weekByNumber = new Map(
  RESONANCE_CONTENT.map((week) => [week.week_number, week] as const),
);
const weekText = (weekNumber: number) =>
  JSON.stringify(weekByNumber.get(weekNumber));

assert.match(
  weekText(2),
  /what information would make you revise it/i,
  "Mirror must preserve a deliberate disconfirmation check rather than treating a first read as settled.",
);
assert.doesNotMatch(
  weekText(2),
  /what do you tend to notice more: things that fit it, things that challenge it/i,
  "Superseded Mirror confirmation wording must not return.",
);

assert.match(
  weekText(3),
  /help actually reduces your load/i,
  "Garden must distinguish help that reduces load from help that creates coordination work.",
);
assert.match(
  weekText(3),
  /hand over the whole job/i,
  "Garden must preserve whole-job transfer, including invisible coordination work.",
);

assert.match(
  weekText(4),
  /approval, pressure, obligation, or expectation/i,
  "Bearing must preserve the distinction between endorsed direction and externally controlled pressure.",
);

const pulseDay2 = weekByNumber
  .get(5)
  ?.days.find((day) => day.day_number === 2);

assert.ok(pulseDay2, "Pulse must retain Day 2.");
assert.equal(
  pulseDay2.prompts.length,
  6,
  "Pulse Day 2 must keep six distinct questions rather than collapsing separate distinctions into one prompt.",
);
assert.match(
  pulseDay2.prompts[0]?.content ?? "",
  /sensations or changes.*body/i,
  "Pulse Day 2 question 1 must begin with body sensation.",
);
assert.match(
  pulseDay2.prompts[1]?.content ?? "",
  /what else besides desire can create similar sensations/i,
  "Pulse Day 2 question 2 must consider alternate causes for a similar sensation.",
);
assert.match(
  pulseDay2.prompts[2]?.content ?? "",
  /what context helps you tell/i,
  "Pulse Day 2 question 3 must add context before assigning meaning.",
);
assert.match(
  pulseDay2.prompts[3]?.content ?? "",
  /first meaning/i,
  "Pulse Day 2 question 4 must make the first meaning explicit rather than hiding it inside another prompt.",
);
assert.match(
  pulseDay2.prompts[4]?.content ?? "",
  /after more time, information, or real contact/i,
  "Pulse Day 2 question 5 must reality-test the first meaning with time, information, or contact.",
);
assert.match(
  pulseDay2.prompts[5]?.content ?? "",
  /what did you choose/i,
  "Pulse Day 2 question 6 must preserve choice as its own step.",
);
assert.equal(
  pulseDay2.prompts[5]?.type,
  "mirror_exercise",
  "Pulse Day 2 must keep the final choice question as the day's mirror exercise.",
);
assert.doesNotMatch(
  weekText(5),
  /how does your body feel different when you are interested in something versus when you want distance from it/i,
  "Superseded Pulse body-equals-meaning wording must not return.",
);

assert.equal(
  weekByNumber.get(6)?.theme,
  "Strong reactions, context, and present choice",
  "Shadow must remain grounded in present context and choice rather than a hidden-origin theory.",
);
assert.match(
  weekText(6),
  /what information would help you check whether the reaction fits what is happening now/i,
  "Shadow must preserve present-context checking before action.",
);
assert.doesNotMatch(
  weekText(6),
  /older memories|internal protection and defensive strategies/i,
  "Superseded Shadow origin-story and defensive-theory wording must not return.",
);

assert.match(
  weekText(7),
  /what action would match that particular problem/i,
  "Forge must preserve repair that matches the actual problem rather than treating apology as sufficient.",
);
assert.doesNotMatch(
  weekText(7),
  /what would you like the other person to do to repair this/i,
  "Superseded generic Forge repair wording must not return.",
);

assert.match(
  weekText(10),
  /what recurring moment could become the cue for the action/i,
  "Becoming must preserve a concrete cue-to-action bridge rather than relying on intention alone.",
);

console.log("Resonance content contract checks passed.");
