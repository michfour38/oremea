import type {
  CompassEndingEngineResult,
  CompassMapCandidate,
} from "./ending-types"
import type { CompassScopeCategory } from "../scope-boundary"

export type CompassEndingEngineInput = {
  mode: "map" | "movement"
  selectedArea: string | null
  areaResponses: unknown
  recursiveLayers: unknown
  possibilityAnswers: unknown
  discussionMessages: unknown
  existingMapItems: unknown
  movements: unknown
}

const SCOPE_VALUES: CompassScopeCategory[] = [
  "in_scope",
  "self_harm_intent",
  "medical",
  "legal",
  "regulated_professional",
]

const MAP_KINDS = [
  "goal",
  "attention",
  "dependency",
  "decision",
  "waiting",
] as const

const OWNERSHIP_VALUES = [
  "mine",
  "shared",
  "someone_else",
  "unclear",
] as const

export async function runCompassEndingEngine(
  input: CompassEndingEngineInput,
): Promise<CompassEndingEngineResult | null> {
  const prompt = buildPrompt(input)

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1400,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Compass ending engine API error:", data)
      return null
    }

    const text = Array.isArray(data?.content)
      ? data.content
          .filter(
            (item: { type?: string; text?: string }) =>
              item?.type === "text",
          )
          .map((item: { text?: string }) => item.text ?? "")
          .join("\n")
          .trim()
      : ""

    if (!text) return null

    const parsed = parseJsonObject(text)
    if (!parsed) return null

    const scopeCategory = SCOPE_VALUES.includes(
      parsed.scopeCategory as CompassScopeCategory,
    )
      ? (parsed.scopeCategory as CompassScopeCategory)
      : "in_scope"

    if (scopeCategory !== "in_scope") {
      return {
        scopeCategory,
        mapItems: [],
        reframe: null,
        movement: null,
        followUpQuestion: null,
      }
    }

    const mapItems = toMapCandidates(parsed.mapItems)
    const movement = toMovement(parsed.movement)

    return {
      scopeCategory,
      mapItems,
      reframe:
        typeof parsed.reframe === "string" && parsed.reframe.trim()
          ? parsed.reframe.trim()
          : null,
      movement,
      followUpQuestion:
        typeof parsed.followUpQuestion === "string" &&
        parsed.followUpQuestion.trim()
          ? parsed.followUpQuestion.trim()
          : null,
    }
  } catch (error) {
    console.error("Compass ending engine request failed:", error)
    return null
  }
}

function buildPrompt(input: CompassEndingEngineInput): string {
  return `
You are the ending intelligence for Compass by Oremea.

Compass is a goal-setting and movement product.
The participant has already completed the course pages that identify goals across eight areas of life, chosen the area they want to focus on, gone deeper, and entered Discussion.

You are working ONLY on the ending.
Do not choose a different goal for them.
Do not reprioritize their life.
The selected area remains the participant's chosen focus.
Keep the other goals in view because they may reveal dependencies, competing demands, useful support, or context.

MODE: ${input.mode}

YOUR JOB

1. Hold the complexity so the participant does not have to keep carrying all of it in working memory.
2. Turn what they have already said into a clean Map of what is asking for attention.
3. Reframe when the current way of holding the problem is creating unnecessary cognitive load.
4. When mode is movement, identify ONE concrete available movement if the information is strong enough.

REFRAMING STANDARD

A reframe changes the structure of the task while preserving reality.
It is not positive thinking.
It is not motivation.
It is not "break it into smaller steps" as a generic instruction.
It should make the next available participation easier to see.

Examples of the KIND of cognitive change you are looking for, not templates to copy:
- a huge undefined outcome becomes one locatable object or dependency
- several collapsed tasks become separate independent tasks
- an apparent motivation problem becomes a missing prerequisite
- something waiting on another person is separated from what the participant can still move
- a task with endless completion criteria gets a clear stopping point
- a large decision load becomes a simple repeatable rule

Do not hardcode cleaning, exercise, laundry, food, work, relationships, or any other domain.
Reason from the participant's actual account.

MAP RULES

Include:
- goals the participant actually named anywhere in the course
- current matters asking for attention
- dependencies
- decisions
- things waiting on another person or event

Do not turn emotions, identity statements, distress, or ordinary description into fake tasks.
"I feel exhausted" is context unless the participant makes a goal or decision around it.
"I am a failure" is not a Map item.

Deduplicate repeated references to the same underlying matter.
Preserve the participant's meaning and wording where practical.
Do not invent goals.
Do not infer obligations merely because something was mentioned.

For each Map item return:
- content: concise human wording
- kind: goal | attention | dependency | decision | waiting
- ownership: mine | shared | someone_else | unclear
- area: one of relationships, income, health, spirituality, investments, network, knowledge, lifestyle, or null
- sourceMessageIndex: zero-based index in DISCUSSION if the item came from a specific discussion message, otherwise null
- sourceSnippet: a brief exact or near-exact phrase showing where it came from, otherwise null

MOVEMENT RULES

Only in movement mode.
A movement is one real participation the person could perform next.
It must be concrete enough to recognise when it is done.
It may be very small when capacity is low.
The participant may be capable of washing their hair, opening curtains, moving one document, sending one message, or making a major business decision. Match the actual person and actual situation.

Do not assume that low capacity means every task must be tiny.
Do not prescribe a movement when the real blocker still needs understanding.
If movement is not yet honestly available, return movement null and ask ONE plain-language follow-up question.

Do not use abstract coaching language.
Do not use the words resistance or avoidance as labels for the participant.
Do not moralise productivity.
Do not tell them what their priority should be.
Do not make them responsible for another person's participation.

SAFETY AND PROFESSIONAL SCOPE

First decide whether this line of discussion is within Compass scope.

Return self_harm_intent ONLY when the participant's actual account indicates intentional self-harm or suicidal intent. Do not infer this from low mood, bed rest, poor hygiene, overeating, undereating, exhaustion, or distress alone.

Return medical when answering would require diagnosis, treatment, medication guidance, or another medical judgement Compass has no authority to provide.
Return legal when answering would require legal advice or legal judgement Compass has no authority to provide.
Return regulated_professional when the requested guidance requires another qualified professional authority Compass does not possess.

The mere presence of health, divorce, finances, conflict, or other serious life circumstances does not make the conversation out of scope. Compass may still help organise ordinary goals and participation around them while staying out of professional advice.

When scope is anything except in_scope, return no Map items, no reframe, no movement, and no follow-up question.

OUTPUT
Return valid JSON only. No markdown. No explanation outside the JSON.

Shape:
{
  "scopeCategory": "in_scope",
  "mapItems": [
    {
      "content": "...",
      "kind": "goal",
      "ownership": "mine",
      "area": "health",
      "sourceMessageIndex": null,
      "sourceSnippet": null
    }
  ],
  "reframe": "... or null",
  "movement": {
    "instruction": "...",
    "reason": "... or null",
    "mapItemContent": "matching Map item content or null"
  },
  "followUpQuestion": null
}

If mode is map, movement must be null.
If movement is unavailable, movement must be null and followUpQuestion should contain one natural question.

SELECTED AREA
${input.selectedArea ?? "None"}

AREA RESPONSES
${stringify(input.areaResponses)}

DEEPER COURSE RESPONSES
${stringify(input.recursiveLayers)}

POSSIBILITY RESPONSES
${stringify(input.possibilityAnswers)}

DISCUSSION
${formatDiscussion(input.discussionMessages)}

EXISTING MAP
${stringify(input.existingMapItems)}

MOVEMENT HISTORY
${stringify(input.movements)}
`.trim()
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  try {
    const value = JSON.parse(cleaned)
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null
  } catch {
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start < 0 || end <= start) return null

    try {
      const value = JSON.parse(cleaned.slice(start, end + 1))
      return value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : null
    } catch {
      return null
    }
  }
}

function toMapCandidates(value: unknown): CompassMapCandidate[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, unknown>
      const content = typeof row.content === "string" ? row.content.trim() : ""
      if (!content) return null

      const kind = MAP_KINDS.includes(
        row.kind as (typeof MAP_KINDS)[number],
      )
        ? (row.kind as (typeof MAP_KINDS)[number])
        : "attention"

      const ownership = OWNERSHIP_VALUES.includes(
        row.ownership as (typeof OWNERSHIP_VALUES)[number],
      )
        ? (row.ownership as (typeof OWNERSHIP_VALUES)[number])
        : "unclear"

      return {
        content,
        kind,
        ownership,
        area: typeof row.area === "string" ? row.area : null,
        sourceMessageIndex:
          Number.isInteger(row.sourceMessageIndex) &&
          Number(row.sourceMessageIndex) >= 0
            ? Number(row.sourceMessageIndex)
            : null,
        sourceSnippet:
          typeof row.sourceSnippet === "string" && row.sourceSnippet.trim()
            ? row.sourceSnippet.trim().slice(0, 240)
            : null,
      } satisfies CompassMapCandidate
    })
    .filter((item): item is CompassMapCandidate => Boolean(item))
}

function toMovement(value: unknown): CompassEndingEngineResult["movement"] {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  const instruction =
    typeof row.instruction === "string" ? row.instruction.trim() : ""

  if (!instruction) return null

  return {
    instruction,
    reason:
      typeof row.reason === "string" && row.reason.trim()
        ? row.reason.trim()
        : null,
    mapItemContent:
      typeof row.mapItemContent === "string" && row.mapItemContent.trim()
        ? row.mapItemContent.trim()
        : null,
  }
}

function formatDiscussion(value: unknown): string {
  if (!Array.isArray(value)) return "[]"

  return value
    .map((message, index) => {
      if (!message || typeof message !== "object") return null
      const row = message as Record<string, unknown>
      const role = typeof row.role === "string" ? row.role : "unknown"
      const content = typeof row.content === "string" ? row.content : ""
      return `[${index}] ${role}: ${content}`
    })
    .filter(Boolean)
    .join("\n\n")
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2)
  } catch {
    return String(value ?? "")
  }
}
