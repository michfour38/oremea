export type PatternBetweenSummary = {
  patternLabel: string
  description: string
  evidence: string[]
}

export function buildPatternBetween(entries: any[]): PatternBetweenSummary {
  const sharedEntries = entries.filter((entry) => entry.scope === "shared")
  const pauseEntries = entries.filter((entry) => entry.scope === "pause")

  const sharedText = sharedEntries
    .map((entry) => entry.content || "")
    .join(" ")
    .toLowerCase()

  const evidence: string[] = []

  if (sharedText.includes("you always") || sharedText.includes("you never")) {
    evidence.push("Fixed language appeared in shared repair.")
  }

  if (pauseEntries.length > 0) {
    evidence.push("The shared space needed containment during this cycle.")
  }

  if (sharedEntries.length === 0) {
    return {
      patternLabel: "Private processing only",
      description:
        "This cycle has not entered shared repair yet. The pattern between participants is not visible from shared entries.",
      evidence,
    }
  }

  if (pauseEntries.length > 0) {
    return {
      patternLabel: "Shared repair interrupted by escalation",
      description:
        "The shared space appears to have needed containment before repair could continue.",
      evidence,
    }
  }

  if (evidence.length > 0) {
    return {
      patternLabel: "Fixed wording in shared repair",
      description:
        "Some shared language may have made the experience feel fixed rather than open to repair.",
      evidence,
    }
  }

  return {
    patternLabel: "Shared repair started",
    description:
      "Shared repair has begun. More shared entries are needed before a recurring pattern can be described.",
    evidence,
  }
}