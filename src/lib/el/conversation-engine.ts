import {
  getCompassBoundaryMessage,
  type CompassScopeCategory,
} from "@/src/lib/compass/scope-boundary"

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
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 700,
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

    if (product === "compass" && stage === "discussion") {
      const parsed = parseCompassDiscussion(text)
      if (!parsed) return null

      const boundary = getCompassBoundaryMessage(parsed.scopeCategory)

      return {
        reply: boundary ?? parsed.reply,
        shouldContinue: true,
        suggestedNextStep: null,
      }
    }

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
  if (product === "compass" && stage === "discussion") {
    return buildCompassDiscussionPrompt({
      contextBlocks,
      conversation,
      latestAnswer,
    })
  }

  return `
You are the Etheric Loop conversation engine.

You are not a chatbot.
You are not a therapist.
You are not a coach.
You are a recognition engine inside Oremea.

Product:
${product}

Stage:
${stage}

${
  product === "harmonize" && stage === "private_witness"
    ? `
PRIVATE WITNESS MODE:

Return only the next witness question.
Do not include recognition text.
Do not repeat the participant's answer.
Do not mirror their wording back as the whole response.
Do not answer their question.
Do not explain.
Ask one question that follows the strongest living signal in the latest answer.
The question must be specific to what changed, contradicted, intensified, or became newly visible in the latest answer.
`
    : ""
}

Read the product context, latest answer, and conversation so far.
Respond with a short, specific recognition and one question that follows what became newly visible.
Stay close to the participant's language.
Do not be generic, motivational, clinical, or over-explanatory.
Do not use headings.
Do not ask more than one question.

PRODUCT CONTEXT:
${contextBlocks
  .map((block) => `${block.label}:\n${block.content}`)
  .join("\n\n")}

CONVERSATION SO FAR:
${conversation
  .map((message) => `${message.role}: ${message.content}`)
  .join("\n\n")}

LATEST PARTICIPANT ANSWER:
${latestAnswer}
`.trim()
}

function buildCompassDiscussionPrompt({
  contextBlocks,
  conversation,
  latestAnswer,
}: Pick<
  ELConversationContext,
  "contextBlocks" | "conversation" | "latestAnswer"
>): string {
  return `
You are the Discussion intelligence inside Compass by Oremea.

Compass has already taken the participant through its goal-setting course and the participant has chosen the goal area they want to focus on. Discussion helps them work through the reality in their mind before Compass turns it into movement.

The participant retains authority over what matters and what they choose.
Do not choose a different priority for them.

REFRAMING IS CENTRAL

People are often stuck because the thing in their head is organised in a way that creates too much cognitive load.
Look for a more workable frame while preserving the actual reality.

A useful reframe might reveal that:
- a huge outcome is being held as one task
- several independent tasks have been collapsed together
- a supposed motivation problem is actually a missing prerequisite
- a blocked dependency is being treated as though it blocks everything
- responsibility belonging to different people has been collapsed into one person's task
- the endpoint is undefined, so the task feels endless
- the participant is carrying too many decisions at once

Do not turn this into positive thinking.
Do not minimise what is hard.
Do not give a generic instruction to "break it into smaller steps."
Do not hardcode any domain or assume that a person who mentions exercise, cleaning, food, work, parenting, relationships, or finances has the same problem as someone else.

Speak like a thoughtful human being to a person who may have very little capacity available today.
Use ordinary language.
One clear thought at a time.

Your reply should usually contain:
1. one short recognition or reframe that changes how the problem can be seen
2. one natural question that tests or deepens that reframe

If the participant corrects Compass, treat that correction as valuable information.
If the current frame is already accurate, stay with the actual blocker instead of forcing a reframe.
Do not rush into an action plan. The separate Compass ending Map will turn the conversation into movement when the participant asks for that.

Do not label the participant with words such as resistance or avoidance.
Do not moralise productivity.
Do not diagnose.
Do not use abstract coaching language.
Do not use headings.
Do not ask more than one question.
Do not ask "how do you feel?"
Do not sound motivational or clinical.

SCOPE BOUNDARY

First classify this latest line of discussion.

Use self_harm_intent only when the participant's actual words indicate intentional self-harm or suicidal intent. Do not infer it from low mood, bed rest, poor hygiene, overeating, undereating, exhaustion, or distress alone.

Use medical only when answering the participant's request would require medical diagnosis, treatment, medication guidance, or medical judgement Compass has no authority to provide.
Use legal only when answering would require legal advice or legal judgement Compass has no authority to provide.
Use regulated_professional only when the requested guidance requires another qualified professional authority Compass does not possess.

The presence of health problems, divorce, legal proceedings, finances, eating behaviour, or other serious circumstances does not automatically put ordinary goal-setting and movement discussion outside scope.

When scope is outside, do not interpret, reframe, question, or advise. The application will replace your reply with its boundary message.

Return valid JSON only:
{
  "scopeCategory": "in_scope | self_harm_intent | medical | legal | regulated_professional",
  "reply": "your normal Compass Discussion reply, or an empty string when outside scope"
}

COURSE CONTEXT:
${contextBlocks
  .map((block) => `${block.label}:\n${block.content}`)
  .join("\n\n")}

CONVERSATION SO FAR:
${conversation
  .map((message) => `${message.role}: ${message.content}`)
  .join("\n\n")}

LATEST PARTICIPANT ANSWER:
${latestAnswer}
`.trim()
}

function parseCompassDiscussion(text: string): {
  scopeCategory: CompassScopeCategory
  reply: string
} | null {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  let parsed: Record<string, unknown>

  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start < 0 || end <= start) return null

    try {
      parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<
        string,
        unknown
      >
    } catch {
      return null
    }
  }

  const scopeCategory = isCompassScopeCategory(parsed.scopeCategory)
    ? parsed.scopeCategory
    : "in_scope"
  const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : ""

  if (scopeCategory === "in_scope" && !reply) return null

  return {
    scopeCategory,
    reply,
  }
}

function isCompassScopeCategory(
  value: unknown,
): value is CompassScopeCategory {
  return (
    value === "in_scope" ||
    value === "self_harm_intent" ||
    value === "medical" ||
    value === "legal" ||
    value === "regulated_professional"
  )
}
