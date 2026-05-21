import {
  generateEthericLoopResponse,
} from "@/src/lib/etheric-loop/relational-response"

export type CompassDiscussionMessage = {
  role: "participant" | "compass"
  content: string
}

export type CompassDiscussionResult = {
  shouldContinueDiscussion: boolean
  compassReply: string
  suggestedMicroStep: string | null
  detectedPattern:
    | "blocked"
    | "self_trust"
    | "avoidance"
    | "overwhelm"
    | "ready"
    | "unclear"
}

export function continueCompassDiscussion({
  messages,
  latestAnswer,
  proposedStep,
}: {
  messages: CompassDiscussionMessage[]
  latestAnswer: string
  proposedStep: string
}): CompassDiscussionResult {
  const previousParticipantAnswers = messages
    .filter((message) => message.role === "participant")
    .map((message) => message.content)

  const response = generateEthericLoopResponse({
    latestAnswer,
    previousAnswers: previousParticipantAnswers,
    proposedStep,
  })

  return {
    shouldContinueDiscussion: response.shouldContinue,
    compassReply: response.reply,
    suggestedMicroStep: response.suggestedMicroStep,
    detectedPattern: mapStateToPattern(
      response.state.primaryState,
    ),
  }
}

function buildBlockedReply(previousAnswers: string[]): string {
  const lastUseful = previousAnswers
    .slice()
    .reverse()
    .find((answer) => answer.split(/\s+/).length > 4)

  if (!lastUseful) {
    return `
“I don’t know” may be true.

It may also mean the step is still too large.

Let’s make it smaller.

What is one tiny thing you could do for yourself today that would count as keeping a promise to yourself?
`.trim()
  }

  return `
You said: “${cleanReference(lastUseful)}”

Now you are saying you do not know how to do it.

That may point to a gap between desire and self-trust.

What is the smallest visible action connected to that answer — so small it would almost feel too easy?
`.trim()
}

function buildSelfTrustReply(answer: string): string {
  return `
You are pointing toward self-trust.

Confidence in the self to follow through is built through kept agreements.

Looking at what you wrote — “${cleanReference(answer)}” — what is one tiny agreement you could keep today, simply to prove:

“I said I would do it, and I did it.”
`.trim()
}

function buildOverwhelmReply(answer: string): string {
  return `
This sounds like the step may still be too large.

You wrote: “${cleanReference(answer)}”

Let’s reduce the pressure.

What is the smallest version of this action that would create movement without asking your nervous system to perform?
`.trim()
}

function buildAvoidanceReply(answer: string): string {
  return `
This may be the core of the section:

sitting with the discomfort instead of escaping it.

You wrote: “${cleanReference(answer)}”

What do you usually do immediately after that discomfort appears?
`.trim()
}

function buildEvolvingReply(
  latestAnswer: string,
  previousAnswers: string[],
): string {
  const answerCount = previousAnswers.length

  if (answerCount <= 1) {
    return `
There is useful information in what you wrote:

“${cleanReference(latestAnswer)}”

Before we finalize a step, what feels most active here:
the goal itself,
the fear of starting,
the pressure to get it right,
or not trusting yourself to follow through?
`.trim()
  }

  if (answerCount === 2) {
    return `
You are adding more context now.

When you say “${cleanReference(latestAnswer)}”, does the real blockage feel practical, emotional, or self-trust based?
`.trim()
  }

  if (answerCount === 3) {
    return `
Let’s move this toward something physical.

What is one action connected to “${cleanReference(latestAnswer)}” that could be completed in less than five minutes?
`.trim()
  }

  return `
We may have enough.

Small motion is still motion.

What is the smallest action you are willing to do today — not to finish the goal, but to keep one agreement with yourself?
`.trim()
}

function isBlockedAnswer(value: string): boolean {
  const blockedAnswers = [
    "i don't know",
    "i dont know",
    "idk",
    "not sure",
    "unsure",
    "maybe",
    "yes",
    "no",
    "ok",
    "okay",
  ]

  return blockedAnswers.includes(value) || value.split(/\s+/).length <= 2
}

function mentionsSelfTrust(value: string): boolean {
  return (
    value.includes("trust myself") ||
    value.includes("self trust") ||
    value.includes("self-trust") ||
    value.includes("follow through") ||
    value.includes("i never do") ||
    value.includes("i don't do") ||
    value.includes("i dont do") ||
    value.includes("i give up") ||
    value.includes("i fail")
  )
}

function mentionsOverwhelm(value: string): boolean {
  return (
    value.includes("too much") ||
    value.includes("overwhelmed") ||
    value.includes("overwhelming") ||
    value.includes("exhausted") ||
    value.includes("tired") ||
    value.includes("can't") ||
    value.includes("cannot")
  )
}

function mentionsAvoidance(value: string): boolean {
  return (
    value.includes("avoid") ||
    value.includes("escape") ||
    value.includes("distract") ||
    value.includes("procrastinate") ||
    value.includes("delay") ||
    value.includes("scroll") ||
    value.includes("freeze")
  )
}

function seemsReady(value: string): boolean {
  return (
    value.includes("i can do") ||
    value.includes("i will do") ||
    value.includes("i'm ready") ||
    value.includes("im ready") ||
    value.includes("this feels doable") ||
    value.includes("doable") ||
    value.includes("i can start")
  )
}

function buildMicroStep(proposedStep: string): string {
  return `
Reduce the step until it becomes almost impossible to avoid.

Do not aim for transformation yet.

Aim for one kept agreement.

Suggested micro-step:
${proposedStep}
`.trim()
}

function mapStateToPattern(
  state: string,
):
  | "blocked"
  | "self_trust"
  | "avoidance"
  | "overwhelm"
  | "ready"
  | "unclear" {
  switch (state) {
    case "self_trust_gap":
      return "self_trust"

    case "avoidance":
      return "avoidance"

    case "overwhelm":
    case "freeze":
    case "collapse":
    case "shame":
      return "overwhelm"

    case "ready":
      return "ready"

    default:
      return "unclear"
  }
}

function cleanReference(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ")

  if (trimmed.length <= 120) {
    return trimmed
  }

  return `${trimmed.slice(0, 120)}...`
}