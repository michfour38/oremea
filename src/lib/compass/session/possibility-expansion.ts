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
  `If ${area} became stronger and more reliable, what would become possible that is not fully possible today?`,
  `What would you be able to choose, create, protect, experience, or build from that stronger reality?`,
  `Who or what would benefit first if this area became more stable, resourced, and available?`,
  `Looking at what you named, which possibility would create the most useful movement first: your independence, your family, your health, your environment, your choices, or something else?`,
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