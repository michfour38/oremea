import {
  detectEthericLoopState,
  type EthericLoopStateResult,
} from "./state-detection";

export type EthericLoopResponseInput = {
  latestAnswer: string;
  previousAnswers?: string[];
  proposedStep?: string;
};

export type EthericLoopResponse = {
  state: EthericLoopStateResult;
  reply: string;
  suggestedMicroStep: string | null;
  shouldContinue: boolean;
};

export function generateEthericLoopResponse({
  latestAnswer,
  previousAnswers = [],
  proposedStep,
}: EthericLoopResponseInput): EthericLoopResponse {
  const state = detectEthericLoopState(latestAnswer);

  return {
    state,
    reply: buildReply({
      latestAnswer,
      previousAnswers,
      proposedStep,
      state,
    }),
    suggestedMicroStep: proposedStep ? softenStep(proposedStep) : null,
    shouldContinue: state.primaryState !== "ready",
  };
}

function buildReply({
  latestAnswer,
  previousAnswers,
  proposedStep,
  state,
}: {
  latestAnswer: string;
  previousAnswers: string[];
  proposedStep?: string;
  state: EthericLoopStateResult;
}) {
  const reference = cleanReference(latestAnswer);
  const previous = previousAnswers.filter(Boolean).slice(-2);

  if (state.primaryState === "self_trust_gap") {
    return `
This does not sound like a lack of desire.

It sounds like the part of you that wants movement does not fully trust the part of you that has to follow through.

That matters.

When self-trust is low, the next step cannot be impressive. It has to be keepable.

You wrote: “${reference}”

What is one agreement so small that keeping it would begin to prove: I do what I say I will do?
`.trim();
  }

  if (state.primaryState === "overwhelm") {
    return `
This sounds too large inside your system right now.

Not necessarily too large as a goal — too large as a starting point.

You wrote: “${reference}”

So we do not push harder here. We reduce the load until movement becomes possible.

What would be the smallest version of this that would not require you to perform, prove, or force anything?
`.trim();
  }

  if (state.primaryState === "avoidance") {
    return `
This may be less about not knowing what to do, and more about what happens when discomfort appears.

Avoidance often protects us from a feeling before it blocks an action.

You wrote: “${reference}”

What do you usually do in the first few minutes after the discomfort arrives?
`.trim();
  }

  if (state.primaryState === "freeze") {
    return `
This sounds like freeze, not laziness.

Freeze often appears when the next step feels unclear, unsafe, too exposed, or too consequential.

You wrote: “${reference}”

Before we choose an action, let’s locate the pressure.

What feels most frozen here: the decision, the first movement, the fear of failing, or the fear of being seen trying?
`.trim();
  }

  if (state.primaryState === "shame") {
    return `
There is self-judgment in this.

And shame usually makes movement heavier, not clearer.

You wrote: “${reference}”

Let’s remove punishment from the process.

If you were not allowed to speak to yourself harshly about this, what would still be true?
`.trim();
  }

  if (state.primaryState === "collapse") {
    return `
This sounds like collapse energy.

Not “I need a better plan,” but “I have stopped believing movement will matter.”

That needs gentleness and precision.

You wrote: “${reference}”

What is one tiny action that would not need hope to complete — only willingness?
`.trim();
  }

  if (state.primaryState === "urgency") {
    return `
There is pressure in this.

Urgency can make every step feel like it has to solve everything immediately.

You wrote: “${reference}”

Let’s separate movement from rescue.

What is the next useful action if it does not need to fix the whole situation today?
`.trim();
  }

  if (state.primaryState === "ready") {
    return `
Good.

Do not make the next step bigger now.

Keep it small, visible, and completeable.

${proposedStep ? `Start with this:\n${softenStep(proposedStep)}` : "Choose one action you can complete today and stop there."}
`.trim();
  }

  if (previous.length > 0) {
    return `
You may not be lacking direction.

You may be standing at the point where awareness is asking to become behavior.

That often feels uncomfortable because movement removes the protection of “still figuring it out.”

You wrote: “${reference}”

What feels more true right now: you do not know what to do, or you know enough to begin but do not yet trust yourself to follow through?
`.trim();
  }

  return `
There is something useful in what you wrote:

“${reference}”

Before we choose a step, let’s be honest about the kind of difficulty this is.

Is the struggle practical, emotional, self-trust based, or fear-based?
`.trim();
}

function softenStep(step: string): string {
  const cleaned = step.trim();

  if (!cleaned) {
    return "Choose one small action you can complete today.";
  }

  return `Reduce this until it can be completed today:\n${cleaned}`;
}

function cleanReference(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ");

  if (trimmed.length <= 140) return trimmed;

  return `${trimmed.slice(0, 140)}...`;
}