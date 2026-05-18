import type {
  CompassResistanceMap,
} from "./session-types"

const AVOIDANCE_PATTERNS = [
  "overthinking",
  "avoidance",
  "delay",
  "procrastination",
  "fear",
  "distraction",
  "collapse",
  "urgency",
  "perfectionism",
  "confusion",
  "shutdown",
  "people pleasing",
]

export function mapResistance({
  answer,
}: {
  answer: string
}): CompassResistanceMap {
  const normalized =
    answer.toLowerCase()

  const detectedPattern =
    AVOIDANCE_PATTERNS.find((pattern) =>
      normalized.includes(pattern),
    ) ?? "unrecognized"

  return {
    obstacle: extractObstacle(answer),

    avoidancePattern:
      detectedPattern,

    emotionalFriction:
      detectEmotionalFriction(normalized),

    supportNeeded:
      determineSupportNeeded(
        detectedPattern,
      ),
  }
}

function extractObstacle(
  input: string,
): string {
  if (input.length < 20) {
    return input
  }

  return input.slice(0, 180)
}

function detectEmotionalFriction(
  normalized: string,
): string {
  if (
    normalized.includes("afraid") ||
    normalized.includes("fear")
  ) {
    return "fear-based resistance"
  }

  if (
    normalized.includes("overwhelmed") ||
    normalized.includes("exhausted")
  ) {
    return "capacity-based resistance"
  }

  if (
    normalized.includes("confused")
  ) {
    return "clarity-based resistance"
  }

  if (
    normalized.includes("ashamed") ||
    normalized.includes("embarrassed")
  ) {
    return "shame-based resistance"
  }

  return "general resistance"
}

function determineSupportNeeded(
  pattern: string,
): string {
  switch (pattern) {
    case "overthinking":
      return "smaller executable actions"

    case "perfectionism":
      return "reduced execution pressure"

    case "collapse":
      return "nervous-system stabilization"

    case "urgency":
      return "slower decision pacing"

    case "avoidance":
      return "lower-friction re-entry"

    default:
      return "clarity and consistency"
  }
}