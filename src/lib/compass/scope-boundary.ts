export type CompassScopeCategory =
  | "in_scope"
  | "self_harm_intent"
  | "medical"
  | "legal"
  | "regulated_professional"

export function getCompassBoundaryMessage(
  category: CompassScopeCategory,
): string | null {
  switch (category) {
    case "self_harm_intent":
      return "What you've described needs immediate human support beyond Compass. Compass will pause here. Please contact your local emergency or crisis service now, or a trusted person who can stay with you while you get support."
    case "medical":
      return "This needs medical guidance from a qualified professional. Compass will pause this line of discussion rather than advise beyond its scope."
    case "legal":
      return "This needs legal guidance from a qualified professional. Compass will pause this line of discussion rather than advise beyond its scope."
    case "regulated_professional":
      return "This needs guidance from a qualified professional with the authority to advise on it. Compass will pause this line of discussion rather than step into that role."
    case "in_scope":
      return null
  }
}
