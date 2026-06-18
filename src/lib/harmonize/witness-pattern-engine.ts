import type { AnchorDefinition } from "./anchor-definition-engine"

type PrivateWitnessEntry = {
  content: string
}

export type EmergentWitnessPattern = {
  anchorDefinition: AnchorDefinition
  supportingEntries: string[]
  strength: number
}

type PatternRule = {
  anchor: string
  type: AnchorDefinition["type"]
  signals: string[]
  minimumSignals: number
  behavioralMarkers: string[]
  behavioralQuestion: string
  evidence: string
  baseStrength: number
}

const PATTERN_RULES: PatternRule[] = [
  {
    anchor: "Safety through distance",
    type: "behavior",
    signals: ["message", "text", "calmer", "softer", "distance", "not in my face"],
    minimumSignals: 2,
    behavioralMarkers: [
      "Communication is safer when there is distance",
      "Softness appears more available by message",
      "Face-to-face contact may increase pressure or threat",
      "Distance changes what becomes possible",
    ],
    behavioralQuestion:
      "What becomes possible at a distance that does not feel possible face-to-face?",
    evidence:
      "Distance, messaging, calm, or softness appeared across more than one entry.",
    baseStrength: 0.76,
  },
  {
    anchor: "Being chosen",
    type: "expectation",
    signals: ["chosen", "choose", "chose", "first", "came to me", "picked me"],
    minimumSignals: 2,
    behavioralMarkers: [
      "Comes to me first",
      "Makes the relationship visible through action",
      "Lets me be the place they return to with truth",
      "Does not make me compete for emotional access",
    ],
    behavioralQuestion:
      "When you imagine being chosen here, what would they have done differently in behavior?",
    evidence:
      "Chosen-ness or being approached first appeared across more than one entry.",
    baseStrength: 0.8,
  },
  {
    anchor: "Emotional outsourcing",
    type: "pattern",
    signals: ["other women", "friends", "runs to", "goes to", "cry", "dump", "purge"],
    minimumSignals: 2,
    behavioralMarkers: [
      "Emotional truth is taken outside the relationship container",
      "Others receive what does not return to the room",
      "Disclosure happens elsewhere while the primary relationship stays unclear",
    ],
    behavioralQuestion:
      "What emotional truth gets taken elsewhere and never makes it back to you?",
    evidence:
      "Emotional disclosure or release elsewhere appeared across more than one entry.",
    baseStrength: 0.78,
  },
  {
    anchor: "Repair needs truth",
    type: "repair",
    signals: ["truth", "honest", "reality", "farce", "lying", "hidden", "secret"],
    minimumSignals: 2,
    behavioralMarkers: [
      "Names what is actually happening",
      "Stops protecting the image of the relationship",
      "Brings hidden truth into shared reality",
      "Lets repair begin from what is real",
    ],
    behavioralQuestion:
      "What truth would need to enter the room before repair could be real?",
    evidence:
      "Truth, reality, or hiddenness appeared across more than one entry.",
    baseStrength: 0.74,
  },
]

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function includesSignal(text: string, signal: string) {
  return text.toLowerCase().includes(signal.toLowerCase())
}

function collectSupportingEntries(entries: PrivateWitnessEntry[], rule: PatternRule) {
  return entries
    .map((entry) => clean(entry.content))
    .filter(Boolean)
    .filter((content) =>
      rule.signals.some((signal) => includesSignal(content, signal)),
    )
}

export function extractEmergentWitnessPatterns(
  entries: PrivateWitnessEntry[],
): EmergentWitnessPattern[] {
  return PATTERN_RULES.map((rule) => {
    const supportingEntries = collectSupportingEntries(entries, rule)
    const matchedSignals = new Set<string>()

    supportingEntries.forEach((entry) => {
      rule.signals.forEach((signal) => {
        if (includesSignal(entry, signal)) {
          matchedSignals.add(signal)
        }
      })
    })

    if (matchedSignals.size < rule.minimumSignals) {
      return null
    }

    return {
      anchorDefinition: {
        anchor: rule.anchor,
        type: rule.type,
        behavioralQuestion: rule.behavioralQuestion,
        behavioralMarkers: rule.behavioralMarkers,
        evidence: [rule.evidence, ...supportingEntries],
        confidence: Math.min(0.94, rule.baseStrength + matchedSignals.size * 0.035),
      },
      supportingEntries,
      strength: Math.min(0.98, rule.baseStrength + matchedSignals.size * 0.05),
    }
  }).filter((pattern): pattern is EmergentWitnessPattern => Boolean(pattern))
}

export function getStrongestEmergentWitnessPattern(
  entries: PrivateWitnessEntry[],
): EmergentWitnessPattern | null {
  const patterns = extractEmergentWitnessPatterns(entries)

  if (patterns.length === 0) return null

  return [...patterns].sort((a, b) => b.strength - a.strength)[0]
}