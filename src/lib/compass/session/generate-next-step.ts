import type {
  CompassExecutionCheck,
  CompassResistanceMap,
} from "./session-types"

export function generateNextStep({
  goal,
  resistance,
  execution,
}: {
  goal: string
  resistance: CompassResistanceMap | null
  execution: CompassExecutionCheck | null
}): string {
  if (
    execution &&
    !execution.isStepExecutable &&
    execution.recalibratedStep
  ) {
    return execution.recalibratedStep
  }

  const interruption =
    resistance?.avoidancePattern ?? ""

  if (interruption === "overthinking") {
    return `
Do not try to solve the whole goal today.

Choose one contained action that creates movement:
- open the page,
- review the document,
- send the message,
- make the call,
- enter the environment,
- or begin by observing what is actually there.

The next step only needs to make the goal less theoretical.
`.trim()
  }

  if (interruption === "collapse") {
    return `
Reduce the size of the next action.

Choose one step that can be started without needing the whole system to be fixed first.

The next movement should restore contact with ${goal}, not complete it.
`.trim()
  }

  if (interruption === "perfectionism") {
    return `
Do one useful version instead of waiting for the perfect version.

Choose an action that can be completed, seen, sent, checked, opened, booked, written, or decided today.

The point is movement, not performance.
`.trim()
  }

  return `
Based on your responses, the next step should be small enough to begin and specific enough to complete.

Choose one action that brings ${goal} out of thought and into reality.

It should be visible, doable, and finished in one clear movement.
`.trim()
}