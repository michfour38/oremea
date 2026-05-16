import { composeCompassOutput } from "./compass-output"
import { detectCompassSignals } from "./language-signals"
import { buildParticipantLanguageProfile } from "./participant-language-profile"
import { detectResonanceInclination } from "./resonance-inclination"
import { synthesizeThoughtAction } from "./thought-action-synthesis"

export function runCompassEngine(input: string) {
  const signals = detectCompassSignals(input)

  const thoughtAction = synthesizeThoughtAction(signals)

  const profile = buildParticipantLanguageProfile(signals)

  const resonanceInclination =
    detectResonanceInclination(profile)

  const output = composeCompassOutput({
    profile,
    thoughtAction,
    resonanceInclination,
  })

  return {
    signals,
    thoughtAction,
    profile,
    resonanceInclination,
    output,
  }
}