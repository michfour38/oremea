import {
  getCompassBoundaryMessage,
  type CompassScopeCategory,
} from "@/src/lib/compass/scope-boundary"
import { OREMEA_EVIDENCE_BOUNDARY } from "@/src/lib/oremea/evidence-boundary"
import { OREMEA_PRODUCT_SOVEREIGNTY } from "@/src/lib/oremea/participant-sovereignty"

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
  scopeCategory?: CompassScopeCategory
  movementReady?: boolean
  retirePriorFrame?: boolean
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

  const attemptCount = product === "compass" && stage === "discussion" ? 2 : 1

  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const text = await callConversationModel(
      attempt === 0
        ? prompt
        : `${prompt}\n\nRETRY FORMAT REQUIREMENT\nReturn the requested valid JSON object only. Preserve the participant's latest meaning and do not ask them to repeat information they already supplied.`,
    )

    if (!text) continue

    if (product === "compass" && stage === "discussion") {
      const parsed = parseCompassDiscussion(text)
      if (!parsed) continue

      const boundary = getCompassBoundaryMessage(parsed.scopeCategory)

      return {
        reply: boundary ?? parsed.reply,
        shouldContinue: true,
        suggestedNextStep: null,
        scopeCategory: parsed.scopeCategory,
        movementReady: parsed.movementReady,
        retirePriorFrame: parsed.retirePriorFrame,
      }
    }

    return {
      reply: text,
      shouldContinue: true,
      suggestedNextStep: null,
    }
  }

  return null
}

async function callConversationModel(prompt: string): Promise<string | null> {
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

    return text || null
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

You are a recognition engine inside Oremea.
Your role changes with the product and stage, but the participant remains the authority over their own meaning.

${OREMEA_EVIDENCE_BOUNDARY}

${OREMEA_PRODUCT_SOVEREIGNTY[product]}

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
Do not repeat the participant's answer as the whole response.
Do not answer their question.
Do not explain.
Ask one question that follows the strongest living signal in the latest answer.
The question must be specific to what changed, contradicted, intensified, or became newly visible in the latest answer.
`
    : ""
}

Read the product context, latest answer, and conversation so far.
The latest participant answer has foreground authority. Earlier conversation and product context help preserve continuity; they do not get to force the latest answer into an earlier interpretation.
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

Compass has already taken the participant through its navigation course. They chose an area as the doorway into The Descent, completed all seven Why layers, named a resource and an available strength or support, considered real possibilities, chose one possibility, and entered Discussion to describe the completed reality.

The starting area is context, not a conclusion. The Descent or Discussion may have moved into a different subject, prerequisite, dependency, need, or practical reality. Follow the participant's live thread rather than forcing the conversation back into the starting category.

${OREMEA_EVIDENCE_BOUNDARY}

${OREMEA_PRODUCT_SOVEREIGNTY.compass}

DISCUSSION EVIDENCE ORDER
- the latest participant message has foreground authority about what is alive now
- earlier participant Discussion messages preserve the immediate conversational thread
- Descent answers show how the starting goal unfolded across all seven Why layers
- possibility-course answers preserve the participant's named resource, available strength or support, real possibilities, and chosen possibility
- area answers preserve the wider goal field
- generated Compass reflections are context only and never proof about the participant

CURRENT-REALITY AUTHORITY
- when the participant corrects Compass, their correction immediately outranks the earlier generated frame
- when the participant says a blocker has changed, ended, or no longer applies, retire that blocker as a current premise
- never keep asking a question whose premise the participant has already answered or corrected
- never manufacture a blocker merely because Compass is a movement product
- if the participant says they already know what they are doing or are already moving, recognise that current reality and follow what is actually next
- an answered question becomes conversation history; ask only the one question that is current now

REFRAMING
Reframing is useful when the participant's own account supports a more workable structure.
A reframe is a hypothesis to place beside their reality, not a declaration of what their problem really is.

A useful reframe may reveal that:
- a huge outcome is being held as one task
- several independent tasks have been collapsed together
- a participant-described prerequisite is missing
- a blocked dependency is being treated as though it blocks everything
- responsibility belonging to different people has been collapsed into one person's task
- the endpoint is undefined, so the task feels endless
- the participant is carrying too many decisions at once

Do not turn this into positive thinking.
Do not minimise what is hard.
Do not give a generic instruction to "break it into smaller steps."
Do not hardcode any domain or assume that a person who mentions exercise, cleaning, food, work, parenting, relationships, or finances has the same problem as someone else.
Do not infer a hidden motive, psychological conflict, identity, or causal story merely because it would make the conversation coherent.

Speak like a thoughtful human being to a person who may have very little capacity available today.
Use ordinary language.
One clear thought at a time.

Your reply should usually contain:
1. one short recognition or evidence-grounded reframe
2. one natural question that tests, deepens, or corrects it

If the current frame is already accurate, stay with the participant's actual situation rather than forcing a reframe.
Do not replace the participant's choice with an action plan. Continue only while the exchange increases useful movement. The separate Compass ending Map will organise participant-named reality and support one participant-chosen movement when something workable is actually available.

MOVEMENT READINESS
Return movementReady true only when the current Discussion contains a participant-owned situation that would genuinely benefit from structuring into movement: a current difficulty, decision, dependency, uncertainty, overload, desired movement, or a direct request for help deciding what to do next.
A named goal or action by itself does not earn movementReady. If the participant already knows what they are doing and has not expressed friction, choice, uncertainty, or a wish for help structuring it, keep movementReady false and continue the live conversation.
Keep movementReady false when the material is still mainly recognition, possibility, or description and there is not yet an honest movement problem to work with.

CORRECTION FLAG
Return retirePriorFrame true when the latest participant message explicitly corrects, replaces, or makes obsolete a prior Compass premise, blocker, interpretation, reframe, or proposed movement.
Otherwise return false.
When retirePriorFrame is true, your reply must follow the corrected reality and must not repeat the retired question or premise.

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
  "reply": "your normal Compass Discussion reply, or an empty string when outside scope",
  "movementReady": false,
  "retirePriorFrame": false
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
  movementReady: boolean
  retirePriorFrame: boolean
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
  const movementReady = parsed.movementReady === true
  const retirePriorFrame = parsed.retirePriorFrame === true

  if (scopeCategory === "in_scope" && !reply) return null

  return {
    scopeCategory,
    reply,
    movementReady,
    retirePriorFrame,
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
