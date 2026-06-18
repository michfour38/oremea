export type AnchorType =
  | "meaning"
  | "behavior"
  | "pattern"
  | "fear"
  | "need"
  | "expectation"
  | "repair"

export type AnchorDefinition = {
  anchor: string
  type: AnchorType
  behavioralQuestion: string
  behavioralMarkers: string[]
  evidence: string[]
  confidence: number
}

type AnchorRule = {
  anchor: string
  type: AnchorType
  signals: string[]
  evidenceRules: Array<{
    pattern: RegExp
    evidence: string
  }>
  behavioralMarkers: string[]
  behavioralQuestion: string
  baseConfidence: number
}

const ANCHOR_RULES: AnchorRule[] = [
  {
    anchor: "Being chosen",
    type: "expectation",
    signals: [
      "chosen",
      "choose",
      "chose",
      "never chose",
      "first",
      "women",
      "cry",
      "shoulders",
      "witness",
      "dump",
      "purge",
    ],
    evidenceRules: [
      {
        pattern: /never chose/i,
        evidence: "He did not choose me.",
      },
      {
        pattern: /women/i,
        evidence: "He goes to other women.",
      },
      {
        pattern: /cry|shoulder/i,
        evidence: "He seeks emotional witness elsewhere.",
      },
      {
        pattern: /dump|purge/i,
        evidence: "He releases his inner world somewhere else.",
      },
      {
        pattern: /witness/i,
        evidence: "Others are allowed to witness what I am not.",
      },
      {
        pattern: /first/i,
        evidence: "Being chosen may mean being approached first.",
      },
    ],
    behavioralMarkers: [
      "Comes to me first",
      "Lets me witness his real emotional state",
      "Shares difficult truths with me directly",
      "Does not outsource intimacy while maintaining performance with me",
      "Returns to me with reality, not a farce",
    ],
    behavioralQuestion:
      "When you imagine being chosen here, what would they have done differently? Not what would they have felt — what would they have done?",
    baseConfidence: 0.72,
  },
  {
    anchor: "Being witnessed",
    type: "need",
    signals: ["see me", "seen", "witness", "heard", "understand", "know me"],
    evidenceRules: [
      {
        pattern: /see me|seen/i,
        evidence: "There is a longing to be seen.",
      },
      {
        pattern: /heard/i,
        evidence: "There is a longing to be heard.",
      },
      {
        pattern: /witness/i,
        evidence: "Being witnessed appears load-bearing.",
      },
      {
        pattern: /know me/i,
        evidence: "Being known appears important.",
      },
    ],
    behavioralMarkers: [
      "Stays present while I tell the truth",
      "Does not turn away from what I reveal",
      "Responds to what I actually said",
      "Lets my reality affect the conversation",
    ],
    behavioralQuestion:
      "If you were being witnessed here, what would they have stayed present for?",
    baseConfidence: 0.64,
  },
  {
    anchor: "Emotional outsourcing",
    type: "pattern",
    signals: ["goes to", "runs to", "other women", "friends", "cry on", "dump"],
    evidenceRules: [
      {
        pattern: /runs to|goes to/i,
        evidence: "They appear to take emotional material elsewhere.",
      },
      {
        pattern: /other women|friends/i,
        evidence: "Other people are receiving the emotional disclosure.",
      },
      {
        pattern: /cry on|dump/i,
        evidence: "Emotional release happens outside the relationship container.",
      },
    ],
    behavioralMarkers: [
      "Takes emotional truth outside the primary repair space",
      "Returns without bringing the real conversation back",
      "Lets others witness what the partner is excluded from",
    ],
    behavioralQuestion:
      "When they take that emotional truth elsewhere, what never makes it back into the room with you?",
    baseConfidence: 0.68,
  },
  {
    anchor: "Safety through distance",
    type: "behavior",
    signals: ["message", "text", "not in my face", "calmer", "softer", "distance"],
    evidenceRules: [
      {
        pattern: /message|text/i,
        evidence: "Communication by message carries different safety.",
      },
      {
        pattern: /calmer/i,
        evidence: "They are calmer at a distance.",
      },
      {
        pattern: /softer/i,
        evidence: "They are softer when not face-to-face.",
      },
      {
        pattern: /not in my face|distance/i,
        evidence: "Physical or emotional distance changes the interaction.",
      },
    ],
    behavioralMarkers: [
      "Communicates more softly by message",
      "Escalates less when not face-to-face",
      "Can access calm when there is distance",
      "May lose softness in direct proximity",
    ],
    behavioralQuestion:
      "What becomes possible by message that does not feel possible face-to-face?",
    baseConfidence: 0.7,
  },
  {
    anchor: "Repair needs truth",
    type: "repair",
    signals: ["truth", "honest", "tell me", "reality", "farce", "lying", "hide"],
    evidenceRules: [
      {
        pattern: /truth|honest/i,
        evidence: "Truth appears necessary for repair.",
      },
      {
        pattern: /reality/i,
        evidence: "Shared reality appears important.",
      },
      {
        pattern: /farce/i,
        evidence: "Performance is obstructing repair.",
      },
      {
        pattern: /lying|hide/i,
        evidence: "Hidden truth is carrying relational weight.",
      },
    ],
    behavioralMarkers: [
      "Names what is actually happening",
      "Stops performing a false version of the relationship",
      "Brings hidden conversations into shared reality",
      "Lets repair begin from truth instead of image",
    ],
    behavioralQuestion:
      "What truth would need to be brought into the room before repair could be real?",
    baseConfidence: 0.66,
  },
]

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim()
}

function clampConfidence(value: number) {
  return Math.max(0.1, Math.min(0.98, value))
}

function signalScore(text: string, rule: AnchorRule) {
  const normalized = normalize(text)

  return rule.signals.reduce((score, signal) => {
    return normalized.includes(signal.toLowerCase()) ? score + 1 : score
  }, 0)
}

function collectEvidence(text: string, rule: AnchorRule) {
  return rule.evidenceRules
    .filter((item) => item.pattern.test(text))
    .map((item) => item.evidence)
}

function buildDefinition(text: string, rule: AnchorRule): AnchorDefinition {
  const evidence = collectEvidence(text, rule)
  const signalCount = signalScore(text, rule)

  return {
    anchor: rule.anchor,
    type: rule.type,
    behavioralQuestion: rule.behavioralQuestion,
    behavioralMarkers: rule.behavioralMarkers,
    evidence: evidence.length > 0 ? evidence : [text],
    confidence: clampConfidence(
      rule.baseConfidence + signalCount * 0.035 + evidence.length * 0.045,
    ),
  }
}

export function defineAnchorFromEntry(entry: string): AnchorDefinition | null {
  const text = entry.trim()

  if (!text) return null

  const matchedRule = [...ANCHOR_RULES]
    .map((rule) => ({
      rule,
      score: signalScore(text, rule),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)[0]

  if (matchedRule) {
    return buildDefinition(text, matchedRule.rule)
  }

  return {
    anchor: "Unclear load-bearing meaning",
    type: "meaning",
    behavioralQuestion:
      "What would have happened differently if this moment had gone the way your body expected it to?",
    behavioralMarkers: [],
    evidence: [text],
    confidence: 0.35,
  }
}

export function getNextWitnessQuestion(entry: string): string {
  const definition = defineAnchorFromEntry(entry)

  if (!definition) {
    return "What happened?"
  }

  return definition.behavioralQuestion
}