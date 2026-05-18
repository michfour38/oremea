import type {
  CompassExecutionCheck,
  CompassResponseTone,
} from "./session-types"

export function calibrateExecutionStep({
  proposedStep,
  participantResponse,
}: {
  proposedStep: string
  participantResponse: string
}): CompassExecutionCheck {
  const tone =
    detectTone(participantResponse)

  const executable =
    isExecutableTone(tone)

  return {
    proposedStep,

    participantFeeling:
      participantResponse,

    tone,

    isStepExecutable: executable,

    recalibratedStep:
      executable
        ? null
        : recalibrateStep(proposedStep),
  }
}

function detectTone(
  input: string,
): CompassResponseTone {
  const normalized =
    input.toLowerCase()

  if (
    normalized.includes("scared") ||
    normalized.includes("afraid") ||
    normalized.includes("too much") ||
    normalized.includes("overwhelming")
  ) {
    return "apprehensive"
  }

  if (
    normalized.includes("confused") ||
    normalized.includes("unsure") ||
    normalized.includes("don't know")
  ) {
    return "uncertain"
  }

  if (
    normalized.includes("excited") ||
    normalized.includes("ready") ||
    normalized.includes("motivated")
  ) {
    return "energized"
  }

  if (
    normalized.includes("resistant") ||
    normalized.includes("avoid") ||
    normalized.includes("don't want")
  ) {
    return "resistant"
  }

  if (
    normalized.includes("emotional") ||
    normalized.includes("sad") ||
    normalized.includes("angry")
  ) {
    return "emotional"
  }

  return "clear"
}

function isExecutableTone(
  tone: CompassResponseTone,
): boolean {
  return ![
    "apprehensive",
    "uncertain",
    "resistant",
  ].includes(tone)
}

function recalibrateStep(
  step: string,
): string {
  return `
This step may currently feel too large, emotionally loaded, or difficult to sustain consistently.

Compass suggests reducing the scale of the action temporarily.

Embodied momentum matters more than fantasy intensity.

Smaller consistent movement is still movement.
`.trim()
}