import type {
  CompassRecursiveLayer,
} from "./session-types"

export type CoreValueReflection = {
  detectedValues: string[]
  primaryValue: string | null
  reflection: string
}

export function reflectCoreValues(
  layers: CompassRecursiveLayer[],
): CoreValueReflection {
  const valueCounts =
    new Map<string, number>()

  for (const layer of layers) {
    for (const value of layer.detectedValueWords) {
      valueCounts.set(
        value,
        (valueCounts.get(value) ?? 0) + 1,
      )
    }
  }

  const sortedValues = [...valueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value)

  const primaryValue =
    sortedValues[0] ?? null

  return {
    detectedValues: sortedValues,

    primaryValue,

    reflection: buildReflection(
      sortedValues,
      primaryValue,
    ),
  }
}

function buildReflection(
  values: string[],
  primaryValue: string | null,
): string {
  if (!primaryValue) {
    return `
Compass can detect several goals and desires emerging,
but no clear underlying value has fully repeated yet.

This is normal.

Sometimes clarity appears gradually through reflection and continued questioning.
`.trim()
  }

  return `
Several of your goals appear connected beneath the surface.

Compass noticed repeated language connected to:

${values.map((value) => `- ${value}`).join("\n")}

This does not mean these values define you absolutely.

It may simply suggest that many of your goals are attempting to create, restore, protect, or experience similar emotional states.

Does this reflection feel accurate to you?
`.trim()
}