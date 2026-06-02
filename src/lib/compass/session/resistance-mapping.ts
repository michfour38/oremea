import type {
  CompassResistanceMap,
} from "./session-types"

const INTERRUPTION_PATTERNS = [
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
    INTERRUPTION_PATTERNS.find((pattern) =>
      normalized.includes(pattern),
    ) ?? "unrecognized"

  return {
    obstacle: extractObstacle(answer),

    avoidancePattern:
      detectedPattern,

    emotionalFriction:
      detectInterruptionType(normalized),

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

function detectInterruptionType(
  normalized: string,
): string {
  if (
    normalized.includes("fear") ||
    normalized.includes("afraid")
  ) {
    return "hesitation"
  }

  if (
    normalized.includes("overwhelmed") ||
    normalized.includes("exhausted")
  ) {
    return "capacity constraint"
  }

  if (
    normalized.includes("confused") ||
    normalized.includes("unclear")
  ) {
    return "clarity constraint"
  }

  if (
    normalized.includes("embarrassed") ||
    normalized.includes("ashamed")
  ) {
    return "exposure concern"
  }

  return "general interruption"
}

function determineSupportNeeded(
  pattern: string,
): string {
  switch (pattern) {
    case "overthinking":
      return "smaller actions"

    case "perfectionism":
      return "lower completion standards"

    case "collapse":
      return "reduced scope"

    case "urgency":
      return "clear sequencing"

    case "avoidance":
      return "lower-friction entry"

    default:
      return "clarity and consistency"
  }
}