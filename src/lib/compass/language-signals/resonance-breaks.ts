import type { ResonanceBreakSignal } from "./types"

const RESONANCE_BREAK_MARKERS = [
  "stopped reading",
  "lost me",
  "not that",
  "retry",
  "that's not it",
  "thats not it",
  "go back",
  "start again",
]

export function detectResonanceBreak(
  input: string,
): ResonanceBreakSignal {
  const normalized = input.toLowerCase()

  const matchedMarker =
    RESONANCE_BREAK_MARKERS.find((marker) =>
      normalized.includes(marker),
    ) ?? null

  return {
    hasResonanceBreak: matchedMarker !== null,
    breakPhrase: matchedMarker,
  }
}