export type CompassScopeCategory =
  | "in_scope"
  | "self_harm_intent"
  | "medical"
  | "legal"
  | "regulated_professional"

function hasImmediateSelfHarmIntent(text: string) {
  const normalized = text.toLowerCase()

  const selfHarmObject =
    /\b(?:kill myself|end my life|take my life|suicide|hurt myself|harm myself|self[- ]harm)\b/i.test(
      normalized,
    )

  if (!selfHarmObject) return false

  return /\b(?:i want to|i'm going to|i am going to|i plan to|i intend to|i will|right now|tonight|today|can't keep myself safe|cannot keep myself safe)\b/i.test(
    normalized,
  )
}

function asksForMedicalAuthority(text: string) {
  return /\b(?:medical advice|diagnos(?:e|is)|prescrib(?:e|ing)|what (?:medication|medicine|dose|dosage|treatment)|how much .* should i take|should i take|is it safe (?:for me )?to take|do i need (?:a doctor|medical treatment)|what should i take for)\b/i.test(
    text,
  )
}

function asksForLegalAuthority(text: string) {
  return /\b(?:legal advice|is (?:this|that|it) legal|is (?:this|that|it) illegal|what are my legal rights|can i sue|should i sue|what should i file|what can i claim|what does the law (?:say|require)|what is the legal position|give me legal advice)\b/i.test(
    text,
  )
}

function asksForRegulatedProfessionalAuthority(text: string) {
  return /\b(?:tax advice|give me tax advice|what should i invest in|what should i buy as an investment|what should i sell|give me investment advice|professional diagnosis|licensed professional advice)\b/i.test(
    text,
  )
}

export function shouldApplyCompassScopeBoundary(
  category: CompassScopeCategory,
  participantText: string,
) {
  switch (category) {
    case "self_harm_intent":
      return hasImmediateSelfHarmIntent(participantText)
    case "medical":
      return asksForMedicalAuthority(participantText)
    case "legal":
      return asksForLegalAuthority(participantText)
    case "regulated_professional":
      return asksForRegulatedProfessionalAuthority(participantText)
    case "in_scope":
      return false
  }
}

export function getCompassBoundaryMessage(
  category: CompassScopeCategory,
  participantText = "",
): string | null {
  if (!shouldApplyCompassScopeBoundary(category, participantText)) {
    return null
  }

  switch (category) {
    case "self_harm_intent":
      return "What you've described needs immediate human support beyond Compass. Compass will pause here. Please contact your local emergency or crisis service now, or a trusted person who can stay with you while you get support."
    case "medical":
      return "This specific question needs medical guidance from a qualified professional. Compass will not answer the medical part, but the rest of your situation can remain in the conversation."
    case "legal":
      return "This specific question needs legal guidance from a qualified professional. Compass will not answer the legal part, but the rest of your situation can remain in the conversation."
    case "regulated_professional":
      return "This specific question needs guidance from a qualified professional with the authority to advise on it. Compass will not answer that professional question, but the rest of your situation can remain in the conversation."
    case "in_scope":
      return null
  }
}
