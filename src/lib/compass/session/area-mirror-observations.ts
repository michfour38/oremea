import type { CompassAreaResponse } from "./session-types"

export function buildBridgeObservation({
  strongest,
}: {
  responses: CompassAreaResponse[]
  strongest: CompassAreaResponse[]
}): string {
  const primary = strongest[0]
  const secondary = strongest[1]
  const tertiary = strongest[2]

  if (!primary) {
    return "Your answers are not pointing clearly enough yet to build a useful bridge."
  }

  if (!secondary) {
    return `
Your answer around ${formatArea(primary.area)} appears to be carrying the most weight.

Compass is looking at how this area may connect your current reality to the reality you want to create.
`.trim()
  }

  return `
These areas do not appear separate.

${formatArea(primary.area)} seems to be carrying the strongest visible weight, but ${formatArea(
    secondary.area,
  )}${tertiary ? ` and ${formatArea(tertiary.area)}` : ""} may be part of the same larger reality.

Compass is looking for the area that would create the strongest bridge between where you are and where you want to be.
`.trim()
}

export function buildSelectionQuestion({
  strongest,
}: {
  responses: CompassAreaResponse[]
  strongest: CompassAreaResponse[]
}): string {
  const primary = strongest[0]

  if (!primary) {
    return "Which area would create the clearest movement from here?"
  }

  return `
Looking at what you wrote, which area would create the strongest bridge between your current reality and the reality you want to create?
`.trim()
}

function formatArea(area: string): string {
  return area.charAt(0).toUpperCase() + area.slice(1)
}