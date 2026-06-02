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
        : recalibrateStep(),
  }
}

function detectTone(
  input: string,
): CompassResponseTone {
  const normalized =
    input.toLowerCase()

  if (
    normalized.includes("too big") ||
    normalized.includes("too much") ||
    normalized.includes("not realistic") ||
    normalized.includes("unrealistic")
  ) {
    return "apprehensive"
  }

  if (
    normalized.includes("confused") ||
    normalized.includes("unclear") ||
    normalized.includes("unsure") ||
    normalized.includes("don't know")
  ) {
    return "uncertain"
  }

  if (
    normalized.includes("ready") ||
    normalized.includes("clear") ||
    normalized.includes("doable") ||
    normalized.includes("realistic")
  ) {
    return "energized"
  }

  if (
    normalized.includes("avoid") ||
    normalized.includes("delay") ||
    normalized.includes("procrastinate") ||
    normalized.includes("don't want")
  ) {
    return "resistant"
  }

  if (
    normalized.includes("public") ||
    normalized.includes("exposed") ||
    normalized.includes("complicated")
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

function recalibrateStep(): string {
  return `
This step is not small enough yet.

Reduce it to one visible action that can be started without needing the whole goal to be solved first.

The next step should be clear, specific, and completeable.
`.trim()
}