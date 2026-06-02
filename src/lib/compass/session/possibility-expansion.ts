type CompassGoalArea =
  | "relationships"
  | "income"
  | "health"
  | "spirituality"
  | "investments"
  | "network"
  | "knowledge"
  | "lifestyle";

export type PossibilityQuestion = {
  question: string;
};

const AREA_LABELS: Record<CompassGoalArea, string> = {
  relationships: "relationships",
  income: "income",
  health: "health",
  spirituality: "spirituality",
  investments: "investments",
  network: "network",
  knowledge: "knowledge",
  lifestyle: "lifestyle",
};

export function getPossibilityQuestion({
  selectedArea,
  index,
}: {
  selectedArea: CompassGoalArea | null;
  index: number;
}): PossibilityQuestion {
  const area = selectedArea ? AREA_LABELS[selectedArea] : "this area";

  const questions = [
  `From a stronger and more reliable position in ${area}, what opens up that feels difficult, restricted, or unavailable today?`,
  `From that stronger position, what are you able to build, create, protect, or support?`,
  `Beyond yourself, who or what benefits most from that change?`,
  `Of everything you just named, which change creates the most meaningful movement right now?`,
];

  return {
    question: questions[index] ?? questions[questions.length - 1],
  };
}

export function buildPossibilityMirror({
  selectedArea,
  possibilityAnswers,
}: {
  selectedArea: CompassGoalArea | null;
  possibilityAnswers: string[];
}): string {
  const area = selectedArea ? AREA_LABELS[selectedArea] : "this area";

  const joined = possibilityAnswers
    .filter(Boolean)
    .map((answer) => answer.trim())
    .join(" ");

  if (!joined) {
    return `Compass is beginning to map what becomes possible around ${area}.`;
  }

  return `
Across your answers, Compass is beginning to see what ${area} may represent beneath the surface.

This does not appear to be only about achieving a goal.

It appears connected to what you want to create, protect, experience, or make more possible in your life.

Before we move into what interrupts this, pause here:

How would you like to move forward with this valued goal of more stable ${area}?
`.trim();
}