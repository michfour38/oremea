export type CompassSignalKind =
  | "thought_detection"
  | "action_compensation"
  | "word_rejection"
  | "word_preference"
  | "resonance_break"

export type CompassSignalIntensity = 1 | 2 | 3 | 4 | 5

export type CompassSignal = {
  kind: CompassSignalKind
  sourceText: string
  rejectedWords: string[]
  preferredWords: string[]
  thoughtLayer: string | null
  actionLayer: string | null
  intensity: CompassSignalIntensity
  note: string
}

export type ThoughtActionSignal = {
  thoughtWords: string[]
  actionWords: string[]
  thoughtLayer: string | null
  actionLayer: string | null
}

export type CorrectionSignal = {
  rejectedWords: string[]
  preferredWords: string[]
  hasRejection: boolean
  hasPreference: boolean
}

export type ResonanceBreakSignal = {
  hasResonanceBreak: boolean
  breakPhrase: string | null
}