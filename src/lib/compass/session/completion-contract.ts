export type CompassCompletionResult =
  | {
      ok: true
      resolutionText: string
      finalStep: string
    }
  | {
      ok: false
      error: string
    }

export function validateCompassCompletion({
  resolutionText,
  resolutionConfirmedAt,
  finalStep,
}: {
  resolutionText: unknown
  resolutionConfirmedAt: unknown
  finalStep: unknown
}): CompassCompletionResult {
  const confirmedResolution =
    typeof resolutionText === "string" ? resolutionText.trim() : ""
  const confirmedMovement =
    typeof finalStep === "string" ? finalStep.trim() : ""

  if (!confirmedResolution || !resolutionConfirmedAt) {
    return {
      ok: false,
      error: "Confirm the resolution before completing Compass.",
    }
  }

  if (!confirmedMovement) {
    return {
      ok: false,
      error: "Choose and confirm a movement before completing Compass.",
    }
  }

  return {
    ok: true,
    resolutionText: confirmedResolution,
    finalStep: confirmedMovement,
  }
}
