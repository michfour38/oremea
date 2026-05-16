import type { CompassSignal } from "./language-signals"

export type ThoughtActionSynthesis = {
  naturalDetection: string[]
  automaticCompensation: string[]
  summary: string
}

export function synthesizeThoughtAction(
  signals: CompassSignal[],
): ThoughtActionSynthesis {
  const naturalDetection = signals
    .filter((signal) => signal.kind === "thought_detection")
    .flatMap((signal) => signal.preferredWords)

  const automaticCompensation = signals
    .filter((signal) => signal.kind === "action_compensation")
    .flatMap((signal) => signal.preferredWords)

  return {
    naturalDetection: unique(naturalDetection),
    automaticCompensation: unique(automaticCompensation),
    summary: buildSummary(
      unique(naturalDetection),
      unique(automaticCompensation),
    ),
  }
}

function buildSummary(
  naturalDetection: string[],
  automaticCompensation: string[],
): string {
  if (
    naturalDetection.length === 0 &&
    automaticCompensation.length === 0
  ) {
    return "No clear thought-to-action pattern detected yet."
  }

  if (naturalDetection.length > 0 && automaticCompensation.length > 0) {
    return "The participant appears to naturally detect through inner recognition, then automatically move into embodied action or compensation."
  }

  if (naturalDetection.length > 0) {
    return "The participant is showing a natural detection pattern, but the action response is not clear yet."
  }

  return "The participant is showing an automatic action or compensation pattern, but the original detection point is not clear yet."
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}