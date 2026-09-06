import { COMPASS_POSSIBILITY_STEP_COUNT } from "./compass-flow-contract"

type CompassGoalArea =
  | "relationships"
  | "income"
  | "health"
  | "spirituality"
  | "investments"
  | "network"
  | "knowledge"
  | "lifestyle"

export type PossibilityQuestion = {
  question: string
}

const AREA_LABELS: Record<CompassGoalArea, string> = {
  relationships: "relationships",
  income: "income",
  health: "health",
  spirituality: "spirituality",
  investments: "investments",
  network: "network",
  knowledge: "knowledge",
  lifestyle: "lifestyle",
}

export const COMPASS_POSSIBILITY_QUESTIONS = [
  (area: string) =>
    `What resource would make movement in ${area} easier?`,
  () =>
    "What strength, ability, or support do you already have that can help?",
  () =>
    "From here, what real possibilities can you see?",
  () =>
    "Which possibility are you choosing to build?",
] as const

if (COMPASS_POSSIBILITY_QUESTIONS.length !== COMPASS_POSSIBILITY_STEP_COUNT) {
  throw new Error("Compass possibility steps do not match the flow contract.")
}

export function getPossibilityQuestion({
  selectedArea,
  index,
}: {
  selectedArea: CompassGoalArea | null
  index: number
}): PossibilityQuestion {
  const area = selectedArea ? AREA_LABELS[selectedArea] : "this direction"
  const question =
    COMPASS_POSSIBILITY_QUESTIONS[index] ??
    COMPASS_POSSIBILITY_QUESTIONS[COMPASS_POSSIBILITY_QUESTIONS.length - 1]

  return {
    question: question(area),
  }
}

export function buildPossibilityMirror({
  selectedArea,
  possibilityAnswers,
}: {
  selectedArea: CompassGoalArea | null
  possibilityAnswers: string[]
}): string {
  const area = selectedArea ? AREA_LABELS[selectedArea] : "this direction"
  const labels = [
    "Resource",
    "Strength or support already available",
    "Possibilities",
    "Chosen possibility",
  ]

  const lines = possibilityAnswers
    .slice(0, COMPASS_POSSIBILITY_STEP_COUNT)
    .map((answer, index) => {
      const value = answer.trim()
      return value ? `${labels[index]}: ${value}` : null
    })
    .filter((line): line is string => Boolean(line))

  if (lines.length !== COMPASS_POSSIBILITY_STEP_COUNT) {
    return `Compass needs all four participant-written answers before reflecting the chosen direction in ${area}.`
  }

  return [
    `You chose to move in ${area}.`,
    ...lines,
    "If this says what you mean, describe the completed reality next. If it does not, go back and change it.",
  ].join("\n\n")
}
