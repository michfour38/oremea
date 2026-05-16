import type { ParticipantLanguageProfile } from "./participant-language-profile"
import type { ResonanceInclination } from "./resonance-inclination"
import type { ThoughtActionSynthesis } from "./thought-action-synthesis"

export type CompassOutput = {
  title: string
  state: string
  thoughtAction: string
  languagePattern: string
  nextStep: string
  resonanceCta: string | null
}

export function composeCompassOutput({
  profile,
  thoughtAction,
  resonanceInclination,
}: {
  profile: ParticipantLanguageProfile
  thoughtAction: ThoughtActionSynthesis
  resonanceInclination: ResonanceInclination
}): CompassOutput {
  return {
    title: "Compass Reflection",

    state: buildState(profile),

    thoughtAction: thoughtAction.summary,

    languagePattern: buildLanguagePattern(profile),

    nextStep: buildNextStep(profile, thoughtAction),

    resonanceCta: resonanceInclination.shouldOfferResonance
      ? resonanceInclination.ctaCopy
      : null,
  }
}

function buildState(
  profile: ParticipantLanguageProfile,
): string {
  if (profile.preferredLanguage.length > 0) {
    return `Your current operating language is forming around: ${profile.preferredLanguage.join(
      ", ",
    )}.`
  }

  return "Your current operating language is still forming."
}

function buildLanguagePattern(
  profile: ParticipantLanguageProfile,
): string {
  if (profile.rejectedLanguage.length > 0) {
    return `You are actively refining your language by rejecting: ${profile.rejectedLanguage.join(
      ", ",
    )}.`
  }

  return "No strong rejected language has surfaced yet."
}

function buildNextStep(
  profile: ParticipantLanguageProfile,
  thoughtAction: ThoughtActionSynthesis,
): string {
  const action =
    thoughtAction.automaticCompensation[0] ??
    profile.dominantActionPatterns[0]

  if (action) {
    return `Choose one contained physical action today that expresses: ${action}.`
  }

  return "Choose one small physical action today that confirms the direction you are building."
}