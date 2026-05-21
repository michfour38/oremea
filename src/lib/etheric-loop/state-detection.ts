export type EthericLoopState =
  | "unclear"
  | "ready"
  | "avoidance"
  | "overwhelm"
  | "self_trust_gap"
  | "collapse"
  | "urgency"
  | "freeze"
  | "shame"
  | "overexplaining";

export type EthericLoopStateResult = {
  primaryState: EthericLoopState;
  secondaryStates: EthericLoopState[];
  confidence: number;
  reasoning: string[];
};

export function detectEthericLoopState(input: string): EthericLoopStateResult {
  const value = input.toLowerCase().trim();
  const reasoning: string[] = [];
  const states: EthericLoopState[] = [];

  if (matches(value, ["i don't know", "i dont know", "not sure", "stuck"])) {
    states.push("unclear");
    reasoning.push("User expresses uncertainty or lack of direction.");
  }

  if (matches(value, ["can't", "cannot", "too much", "overwhelmed", "exhausted", "tired"])) {
    states.push("overwhelm");
    reasoning.push("User signals that the step may feel too large or draining.");
  }

  if (matches(value, ["avoid", "procrastinate", "delay", "scroll", "distract", "escape"])) {
    states.push("avoidance");
    reasoning.push("User names avoidance or displacement behavior.");
  }

  if (matches(value, ["trust myself", "follow through", "i never do", "i give up", "i fail"])) {
    states.push("self_trust_gap");
    reasoning.push("User indicates low confidence in their own follow-through.");
  }

  if (matches(value, ["what's the point", "nothing works", "i can't anymore", "give up"])) {
    states.push("collapse");
    reasoning.push("User language suggests collapse or resignation.");
  }

  if (matches(value, ["now", "urgent", "immediately", "panic", "quickly", "desperate"])) {
    states.push("urgency");
    reasoning.push("User language suggests urgency or pressure.");
  }

  if (matches(value, ["freeze", "blank", "numb", "shut down", "paralyzed", "paralysed"])) {
    states.push("freeze");
    reasoning.push("User describes immobilization or shutdown.");
  }

  if (matches(value, ["ashamed", "shame", "embarrassed", "pathetic", "failure", "useless"])) {
    states.push("shame");
    reasoning.push("User language carries self-judgment or shame.");
  }

  if (input.split(/\s+/).length > 120) {
    states.push("overexplaining");
    reasoning.push("Long response may indicate cognitive looping or overexplaining.");
  }

  if (matches(value, ["i can do", "i will", "i'm ready", "im ready", "doable", "i can start"])) {
    states.push("ready");
    reasoning.push("User signals readiness for action.");
  }

  const uniqueStates = Array.from(new Set(states));
  const primaryState = uniqueStates[0] ?? "unclear";

  return {
    primaryState,
    secondaryStates: uniqueStates.slice(1),
    confidence: calculateConfidence(uniqueStates.length, input.length),
    reasoning,
  };
}

function matches(value: string, phrases: string[]): boolean {
  return phrases.some((phrase) => value.includes(phrase));
}

function calculateConfidence(stateCount: number, inputLength: number): number {
  if (stateCount === 0) return 0.25;
  if (stateCount === 1 && inputLength < 40) return 0.55;
  if (stateCount === 1) return 0.7;
  if (stateCount === 2) return 0.82;
  return 0.9;
}