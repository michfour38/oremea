import {
  defineAnchorFromEntry,
  type AnchorDefinition,
} from "./anchor-definition-engine"
import { getStrongestEmergentWitnessPattern } from "./witness-pattern-engine"

export type WitnessSignal = {
  entryIndex: number
  excerpt: string
  anchorDefinition: AnchorDefinition
  strength: number
  source: "entry" | "pattern"
}

type PrivateWitnessEntry = {
  content: string
}

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function excerpt(text: string) {
  const cleaned = clean(text)
  return cleaned.length > 160 ? `${cleaned.slice(0, 160)}...` : cleaned
}

function anchorTypeWeight(type: AnchorDefinition["type"]) {
  if (type === "expectation") return 0.1
  if (type === "pattern") return 0.09
  if (type === "repair") return 0.08
  if (type === "need") return 0.07
  if (type === "fear") return 0.07
  if (type === "behavior") return 0.06
  return 0.04
}

function calculateStrength(anchor: AnchorDefinition) {
  const evidenceWeight = anchor.evidence.length * 0.08
  const markerWeight = anchor.behavioralMarkers.length * 0.04
  const typeWeight = anchorTypeWeight(anchor.type)

  return Math.min(
    0.98,
    anchor.confidence + evidenceWeight + markerWeight + typeWeight,
  )
}

export function extractWitnessSignals(
  entries: PrivateWitnessEntry[],
): WitnessSignal[] {
  const entrySignals = entries
    .map((entry, index) => {
      const content = clean(entry.content)
      if (!content) return null

      const anchorDefinition = defineAnchorFromEntry(content)
      if (!anchorDefinition) return null

      return {
        entryIndex: index,
        excerpt: excerpt(content),
        anchorDefinition,
        strength: calculateStrength(anchorDefinition),
        source: "entry" as const,
      }
    })
    .filter(
  (
    signal,
  ): signal is {
    entryIndex: number
    excerpt: string
    anchorDefinition: AnchorDefinition
    strength: number
    source: "entry"
  } => Boolean(signal),
)

  const strongestPattern = getStrongestEmergentWitnessPattern(entries)

  if (!strongestPattern) {
    return entrySignals
  }

  return [
    ...entrySignals,
    {
      entryIndex: -1,
      excerpt: strongestPattern.supportingEntries.join(" → "),
      anchorDefinition: strongestPattern.anchorDefinition,
      strength: strongestPattern.strength,
      source: "pattern",
    },
  ]
}

export function getStrongestWitnessSignal(
  entries: PrivateWitnessEntry[],
): WitnessSignal | null {
  const signals = extractWitnessSignals(entries)

  if (signals.length === 0) return null

  return [...signals].sort((a, b) => b.strength - a.strength)[0]
}