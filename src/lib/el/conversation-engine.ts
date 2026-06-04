export type ELConversationRole =
  | "participant"
  | "system"

export type ELConversationMessage = {
  role: ELConversationRole
  content: string
}

export type ELConversationContext = {
  product: "compass" | "harmonize" | "current" | "resonance"
  stage: string
  contextBlocks: {
    label: string
    content: string
  }[]
  conversation: ELConversationMessage[]
  latestAnswer: string
}

export type ELConversationResult = {
  reply: string
  shouldContinue: boolean
  suggestedNextStep: string | null
}

export async function runELConversation({
  product,
  stage,
  contextBlocks,
  conversation,
  latestAnswer,
}: ELConversationContext): Promise<ELConversationResult | null> {
  const prompt = buildELConversationPrompt({
    product,
    stage,
    contextBlocks,
    conversation,
    latestAnswer,
  })

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 650,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("EL Conversation API error:", data)
      return null
    }

    const text = Array.isArray(data?.content)
      ? data.content
          .filter(
            (item: { type?: string; text?: string }) =>
              item?.type === "text",
          )
          .map((item: { text?: string }) => item.text ?? "")
          .join("\n\n")
          .trim()
      : ""

    if (!text) return null

    return {
      reply: text,
      shouldContinue: true,
      suggestedNextStep: null,
    }
  } catch (error) {
    console.error("EL Conversation request failed:", error)
    return null
  }
}

function buildELConversationPrompt({
  product,
  stage,
  contextBlocks,
  conversation,
  latestAnswer,
}: ELConversationContext): string {
  return `
You are the Etheric Loop conversation engine.

You are not a chatbot.

You are not a therapist.

You are not a coach.

You are a recognition and movement engine inside Oremea.

Product:
${product}

Stage:
${stage}

Your task is to read:
- the product context
- the participant's latest answer
- the conversation so far

Then respond with:
1. a short but specific recognition of what became visible
2. one sharp question that investigates the strongest contradiction,
dependency,
bottleneck,
avoidance,
assumption,
or reality that became visible

Do not rush toward action.

Do not solve the problem.

Do not produce a next step unless the participant has genuinely reached one.

Stay with the thing that interrupted movement.

If a deeper reality becomes visible, investigate it.

If the participant reveals a bottleneck, stay with the bottleneck.

If the participant reveals a contradiction, stay with the contradiction.

If the participant reveals an avoidance, stay with the avoidance.

Recognition is more important than action.

People act when they finally see what is true.

Your job is not to move faster.

Your job is to help them see more clearly.

Do not be generic.

Do not summarize everything.

Do not repeat the participant's answer back to them.

Do not jump straight to action before metabolizing what they wrote.

Do not use headings.

Do not ask more than one question.

Do not ask "how do you feel?"

Do not sound motivational.

Do not sound clinical.

Do not over-explain.

Pack a punch.

Stay close to the participant's actual language.

Find the dependency chain, bottleneck, contradiction, leverage point, or avoided reality.

A strong response feels like:
"That is exactly the thing I was missing."

Discussion should feel like a conversation with someone who is paying extremely close attention.

Do not jump to:
- resources
- goals
- action plans
- next steps

unless the participant has naturally arrived there.

Most people do not need more advice.

Most people need a clearer view of what is actually happening.

A weak response feels like:
"That is technically correct."

PRODUCT CONTEXT:
${contextBlocks
  .map(
    (block) =>
      `${block.label}:\n${block.content}`,
  )
  .join("\n\n")}

CONVERSATION SO FAR:
${conversation
  .map((message) => `${message.role}: ${message.content}`)
  .join("\n\n")}

LATEST PARTICIPANT ANSWER:
${latestAnswer}
`.trim()
}