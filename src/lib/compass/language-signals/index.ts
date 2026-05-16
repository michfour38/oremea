import { detectCorrectionSignals } from "./corrections"
import { getSignalIntensity } from "./intensity"
import { detectResonanceBreak } from "./resonance-breaks"
import { detectThoughtActionSignals } from "./thought-action"

import type {
  CompassSignal,
  CompassSignalKind,
} from "./types"

export function detectCompassSignals(
  input: string,
): CompassSignal[] {
  const signals: CompassSignal[] = []

  const intensity = getSignalIntensity(input)

  const thoughtAction =
    detectThoughtActionSignals(input)

  const corrections =
    detectCorrectionSignals(input)

  const resonanceBreak =
    detectResonanceBreak(input)

  if (thoughtAction.thoughtWords.length > 0) {
    signals.push(
      createSignal({
        kind: "thought_detection",
        input,
        intensity,
        preferredWords: thoughtAction.thoughtWords,
        thoughtLayer: thoughtAction.thoughtLayer,
        actionLayer: null,
        note:
          "Participant is naturally detecting, sensing, discerning, or recognizing something internally.",
      }),
    )
  }

  if (thoughtAction.actionWords.length > 0) {
    signals.push(
      createSignal({
        kind: "action_compensation",
        input,
        intensity,
        preferredWords: thoughtAction.actionWords,
        thoughtLayer: null,
        actionLayer: thoughtAction.actionLayer,
        note:
          "Participant is describing an embodied action, stabilization pattern, compensation behavior, or execution response.",
      }),
    )
  }

  if (corrections.hasRejection) {
    signals.push(
      createSignal({
        kind: "word_rejection",
        input,
        intensity,
        rejectedWords: corrections.rejectedWords,
        note:
          "Participant rejected wording or interpretive framing. Rejected language should lose weighting in future synthesis.",
      }),
    )
  }

  if (corrections.hasPreference) {
    signals.push(
      createSignal({
        kind: "word_preference",
        input,
        intensity,
        preferredWords: corrections.preferredWords,
        note:
          "Participant confirmed resonance with wording or framing. Preferred language should gain weighting in future synthesis.",
      }),
    )
  }

  if (resonanceBreak.hasResonanceBreak) {
    signals.push(
      createSignal({
        kind: "resonance_break",
        input,
        intensity: 5,
        note:
          "Participant experienced a resonance break. Compass should return to the exact phrase or interpretive shift before continuing.",
      }),
    )
  }

  return signals
}

type CreateSignalInput = {
  kind: CompassSignalKind
  input: string
  intensity: 1 | 2 | 3 | 4 | 5
  rejectedWords?: string[]
  preferredWords?: string[]
  thoughtLayer?: string | null
  actionLayer?: string | null
  note: string
}

function createSignal({
  kind,
  input,
  intensity,
  rejectedWords = [],
  preferredWords = [],
  thoughtLayer = null,
  actionLayer = null,
  note,
}: CreateSignalInput): CompassSignal {
  return {
    kind,
    sourceText: input,
    rejectedWords,
    preferredWords,
    thoughtLayer,
    actionLayer,
    intensity,
    note,
  }
}