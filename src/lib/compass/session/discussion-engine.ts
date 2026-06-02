import {
  runELTick,
  type EngineTick,
} from "@/src/lib/el"

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
}: {
  messages: CompassDiscussionMessage[]
  latestAnswer: string
  proposedStep: string
}): CompassDiscussionResult {
  const previousTicks = extractPreviousTicks(messages)

  const result = runELTick({
    participantResponse: latestAnswer,
    previousTicks,
  })

  return {
    shouldContinueDiscussion: result.shouldContinue,
    compassReply: result.reply,
    suggestedMicroStep:
      result.tick.primaryState === "movement_current"
        ? latestAnswer
        : null,
    detectedPattern:
      result.tick.primaryState === "movement_current"
        ? "ready"
        : "unclear",
  }
}

function extractPreviousTicks(
  messages: CompassDiscussionMessage[],
): EngineTick[] {
  return messages
    .filter((message) =>
      message.content.startsWith("__EL_TICK__"),
    )
    .map((message) => {
      try {
        return JSON.parse(
          message.content.replace("__EL_TICK__", ""),
        ) as EngineTick
      } catch {
        return null
      }
    })
    .filter((tick): tick is EngineTick => Boolean(tick))
}