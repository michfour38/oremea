export const COMPASS_DESCENT_LAYER_COUNT = 7 as const

export const COMPASS_PRIMARY_FLOW = [
  "intro",
  "area",
  "area_mirror",
  "area_confirmation",
  "depth_intro",
  "depth",
  "core_reflection",
  "discussion",
] as const

export type CompassPrimaryPhase = (typeof COMPASS_PRIMARY_FLOW)[number]

export const COMPASS_PHASE_PURPOSE: Record<CompassPrimaryPhase, string> = {
  intro:
    "Set the participant-owned navigation contract before any questions begin.",
  area:
    "Collect the realities the participant wants to build across the eight life areas.",
  area_mirror:
    "Return the participant's own field without deciding which area matters most.",
  area_confirmation:
    "Let the participant choose the starting doorway for this Compass run.",
  depth_intro:
    "Explain and obtain the participant's deliberate entry into all seven Why layers.",
  depth:
    "Follow why the chosen direction matters for exactly seven accepted layers without introducing possibility, planning, or action.",
  core_reflection:
    "Reflect the completed Descent in the participant's words and let them decide whether to enter Discussion.",
  discussion:
    "Continue from the Core Reflection, resolve what is actually current, maintain the working Map, and end with one participant-chosen movement.",
}
