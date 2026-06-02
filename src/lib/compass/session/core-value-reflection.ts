import type {
  CompassRecursiveLayer,
} from "./session-types"

export type CoreValueReflection = {
  detectedValues: string[]
  primaryValue: string | null
  reflection: string
}

const CORE_REALITY_WORDS = [
  "freedom",
  "possibility",
  "possible",
  "choice",
  "agency",
  "independence",
  "self-reliance",
  "responsibility",
  "stability",
  "security",
  "support",
  "confidence",
  "clarity",
  "movement",
  "provision",
  "capacity",
  "sovereignty",
]

export function reflectCoreValues(
  layers: CompassRecursiveLayer[],
): CoreValueReflection {
  const valueCounts = new Map<string, number>()

  for (const layer of layers) {
    for (const value of layer.detectedValueWords) {
      valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1)
    }
  }

  const sortedValues = [...valueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value)

  const primaryValue = sortedValues[0] ?? null

  return {
    detectedValues: sortedValues,
    primaryValue,
    reflection: buildCoreRealityReflection(layers, sortedValues, primaryValue),
  }
}

function buildCoreRealityReflection(
  layers: CompassRecursiveLayer[],
  values: string[],
  primaryValue: string | null,
): string {
  const usableLayers = layers.filter((layer) => layer.answer.trim())

  if (usableLayers.length === 0) {
    return `
There is not enough here yet to reflect a useful core reality.

Compass needs your own words before it should say anything back.
`.trim()
  }

  const deepestLayers = usableLayers.slice(-3)

  const combinedDeepText = deepestLayers
    .map((layer) => layer.answer)
    .join(" ")
    .toLowerCase()

  const coreMatches = uniqueMatches(combinedDeepText, CORE_REALITY_WORDS)

  const strongestLines = deepestLayers
    .map(
      (layer) =>
        `Layer ${layer.layer}: “${cleanReference(layer.answer)}”`,
    )
    .join("\n\n")

  const strongestCore =
    coreMatches[0] ??
    values[0] ??
    primaryValue ??
    null

  const coreLine = strongestCore
    ? `The clearest core reality appears to be ${strongestCore}.`
    : "The core reality has not fully named itself yet."

const realityLine = strongestCore
  ? `Again and again, your answers return to ${strongestCore}.`
  : "A recurring reality appears to be emerging from your answers."

  return `
A core reality is beginning to take shape.

Look at what you wrote most recently:

${strongestLines}

${coreLine}

This does not appear to be only about achieving the original goal.

It appears to be about the reality that goal would make possible.

${realityLine}

Looking at everything you have written:

If more of this reality became available in your life, what would become possible that is not fully possible today?
`.trim()
}

function uniqueMatches(
  text: string,
  words: string[],
): string[] {
  return words.filter((word, index) => {
    const appears = text.includes(word)
    const firstIndex = words.indexOf(word) === index

    return appears && firstIndex
  })
}

function cleanReference(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ")

  if (trimmed.length <= 180) {
    return trimmed
  }

  return `${trimmed.slice(0, 180)}...`
}