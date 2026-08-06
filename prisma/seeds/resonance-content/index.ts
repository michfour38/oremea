import type { ResonanceWeekSeed } from "./types";
import { WEEK_1 } from "./week-1";
import { WEEK_2 } from "./week-2";
import { WEEK_3 } from "./week-3";
import { WEEK_4 } from "./week-4";
import { WEEK_5 } from "./week-5";
import { WEEK_6 } from "./week-6";
import { WEEK_7 } from "./week-7";
import { WEEK_8 } from "./week-8";
import { WEEK_9 } from "./week-9";
import { WEEK_10 } from "./week-10";

export type { ResonanceDaySeed, ResonancePromptSeed, ResonanceWeekSeed } from "./types";

export const RESONANCE_CONTENT: readonly ResonanceWeekSeed[] = [
  WEEK_1,
  WEEK_2,
  WEEK_3,
  WEEK_4,
  WEEK_5,
  WEEK_6,
  WEEK_7,
  WEEK_8,
  WEEK_9,
  WEEK_10,
];

export function getResonanceWeekSeed(weekNumber: number): ResonanceWeekSeed {
  const week = RESONANCE_CONTENT.find((candidate) => candidate.week_number === weekNumber);

  if (!week) {
    throw new Error(`Unknown Resonance week: ${weekNumber}`);
  }

  return week;
}
