type CompassGoalArea =
  | "relationships"
  | "income"
  | "health"
  | "spirituality"
  | "investments"
  | "network"
  | "knowledge"
  | "lifestyle"

type CompassAreaResponse = {
  area: CompassGoalArea
  answer: string
}

export type PriorityRedirectResult = {
  shouldRedirect: boolean
  suggestedArea: CompassGoalArea | null
  reason: string | null
}

const AREA_KEYWORDS: Record<CompassGoalArea, string[]> = {
  relationships: [
    "relationship",
    "partner",
    "connection",
    "communication",
    "trust",
    "dating",
    "marriage",
    "family",
  ],
  income: [
    "money",
    "income",
    "work",
    "job",
    "salary",
    "business",
    "debt",
    "pay",
    "earning",
    "financial",
  ],
  health: [
    "body",
    "health",
    "tired",
    "exhausted",
    "sleep",
    "energy",
    "pain",
    "food",
    "exercise",
  ],
  spirituality: [
    "meaning",
    "purpose",
    "faith",
    "spiritual",
    "prayer",
    "soul",
    "trust life",
  ],
  investments: [
    "invest",
    "assets",
    "saving",
    "wealth",
    "property",
    "future money",
  ],
  network: [
    "people",
    "community",
    "support",
    "contacts",
    "circle",
    "network",
    "friends",
  ],
  knowledge: [
    "learn",
    "study",
    "skill",
    "understand",
    "research",
    "course",
    "education",
  ],
  lifestyle: [
    "home",
    "routine",
    "freedom",
    "stability",
    "children",
    "time",
    "life",
    "living",
  ],
}

export function evaluatePriorityRedirect({
  selectedArea,
  areaResponses,
  recursiveAnswers,
  resistanceAnswer,
}: {
  selectedArea: CompassGoalArea | null
  areaResponses: CompassAreaResponse[]
  recursiveAnswers: string[]
  resistanceAnswer?: string
}): PriorityRedirectResult {
  if (!selectedArea) {
    return {
      shouldRedirect: false,
      suggestedArea: null,
      reason: null,
    }
  }

  const text = [
    ...areaResponses.map((response) => response.answer),
    ...recursiveAnswers,
    resistanceAnswer ?? "",
  ]
    .join(" ")
    .toLowerCase()

  const scores = Object.entries(AREA_KEYWORDS).map(([area, keywords]) => {
    const score = keywords.reduce((total, keyword) => {
      return text.includes(keyword) ? total + 1 : total
    }, 0)

    return {
      area: area as CompassGoalArea,
      score,
    }
  })

  const sorted = scores.sort((a, b) => b.score - a.score)
  const strongest = sorted[0]
  const selected = scores.find((score) => score.area === selectedArea)

  if (!strongest || !selected) {
    return {
      shouldRedirect: false,
      suggestedArea: null,
      reason: null,
    }
  }

  const redirectIsClear =
    strongest.area !== selectedArea &&
    strongest.score >= selected.score + 2 &&
    strongest.score >= 3

  if (!redirectIsClear) {
    return {
      shouldRedirect: false,
      suggestedArea: null,
      reason: null,
    }
  }

  return {
    shouldRedirect: true,
    suggestedArea: strongest.area,
    reason:
      "The emotional weight in your answers appears to be gathering around a different area than the one originally selected.",
  }
}