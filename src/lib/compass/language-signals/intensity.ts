import type { CompassSignalIntensity } from "./types"

export function getSignalIntensity(
  input: string,
): CompassSignalIntensity {
  const normalized = input.trim()

  if (!normalized) {
    return 1
  }

  const exclamations = (normalized.match(/!/g) || []).length

  const capsWords = normalized
    .split(/\s+/)
    .filter((word) => {
      return word.length > 2 && word === word.toUpperCase()
    }).length

  const hasResonanceBreak = normalized
    .toLowerCase()
    .includes("stopped reading")

  if (hasResonanceBreak) {
    return 5
  }

  if (exclamations >= 3 || capsWords >= 3) {
    return 5
  }

  if (exclamations >= 1 || capsWords >= 1) {
    return 4
  }

  if (normalized.length > 240) {
    return 3
  }

  if (normalized.length > 80) {
    return 2
  }

  return 1
}