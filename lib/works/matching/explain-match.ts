type ExplainableOutcome = {
  status: "MATCH" | "NO_MATCH" | "UNKNOWN";
  criterion_type: string;
  explanation: string;
  step?: { title: string } | null;
  requirement?: { display_value: string | null } | null;
};

type ExplainableMatch = {
  status: "MATCH" | "NO_MATCH" | "UNKNOWN";
  covered_step_count: number;
  outcomes: ExplainableOutcome[];
};

export type WorksMatchExplanation = {
  label: "Strong fit" | "Potential match" | "Doesn't fit this brief";
  summary: string;
  canHelpWith: string[];
  confirmed: string[];
  unresolved: string[];
  conflicts: string[];
};

export function explainWorksMatch(match: ExplainableMatch): WorksMatchExplanation {
  const canHelpWith = match.outcomes
    .filter(
      (outcome) =>
        outcome.status === "MATCH" &&
        outcome.criterion_type === "PATH_STEP" &&
        outcome.step?.title
    )
    .map((outcome) => outcome.step!.title);

  const confirmed = match.outcomes
    .filter(
      (outcome) =>
        outcome.status === "MATCH" && outcome.criterion_type !== "PATH_STEP"
    )
    .map(
      (outcome) => outcome.requirement?.display_value ?? outcome.explanation
    );

  const unresolved = match.outcomes
    .filter((outcome) => outcome.status === "UNKNOWN")
    .map(
      (outcome) => outcome.requirement?.display_value ?? outcome.explanation
    );

  const conflicts = match.outcomes
    .filter((outcome) => outcome.status === "NO_MATCH")
    .map(
      (outcome) => outcome.requirement?.display_value ?? outcome.explanation
    );

  if (match.status === "MATCH") {
    return {
      label: "Strong fit",
      summary:
        match.covered_step_count > 1
          ? `Can complete ${match.covered_step_count} open production steps with no unresolved required condition in its scope.`
          : "Can complete an open production step with no unresolved required condition in its scope.",
      canHelpWith,
      confirmed,
      unresolved,
      conflicts,
    };
  }

  if (match.status === "UNKNOWN") {
    return {
      label: "Potential match",
      summary:
        "This provider can contribute to the route, but at least one material fact still needs confirmation.",
      canHelpWith,
      confirmed,
      unresolved,
      conflicts,
    };
  }

  return {
    label: "Doesn't fit this brief",
    summary:
      "A confirmed requirement or route condition prevents this offering from fitting the current brief.",
    canHelpWith,
    confirmed,
    unresolved,
    conflicts,
  };
}
