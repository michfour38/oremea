import {
  runELTick,
  type EngineTick,
} from "@/src/lib/el"

export type ActionThreadStage =
  | "bottleneck"
  | "clarify_bottleneck"
  | "resource"
  | "blockage"
  | "avoidance"
  | "completed_action"
  | "reverse_engineer"
  | "complete"

export type ActionThreadMessage = {
  role: "participant" | "compass"
  content: string
}

export type ActionThreadResult = {
  stage: ActionThreadStage
  compassReply: string
  completedAction: string | null
  shouldContinue: boolean
}

export function continueActionThread({
  messages,
  latestAnswer,
}: {
  messages: ActionThreadMessage[]
  latestAnswer: string
}): ActionThreadResult {
  const previousTicks = extractPreviousTicks(messages)

  const result = runELTick({
    participantResponse: latestAnswer,
    previousTicks,
  })

  const isComplete =
    result.tick.primaryState === "movement_current"

  return {
    stage: isComplete ? "complete" : mapELStateToActionStage(result.tick.primaryState),
    compassReply: result.reply,
    completedAction: isComplete ? latestAnswer : null,
    shouldContinue: result.shouldContinue,
  }
}

function extractPreviousTicks(
  messages: ActionThreadMessage[],
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

function mapELStateToActionStage(
  state: EngineTick["primaryState"],
): ActionThreadStage {
  switch (state) {
    case "resource_missing":
      return "resource"

    case "resource_identified":
      return "blockage"

    case "objection_present":
      return "avoidance"

    case "movement_ready":
      return "completed_action"

    case "movement_current":
      return "complete"

    case "possibility_emerging":
      return "clarify_bottleneck"

    case "choice_forming":
      return "clarify_bottleneck"

    default:
      return "bottleneck"
  }
}