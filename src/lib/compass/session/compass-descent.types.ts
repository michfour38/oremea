import type {
  MeaningAnswerForm,
  MeaningDirection,
  MeaningMovement,
} from "@/src/lib/oremea/meaning-movement"

export const COMPASS_DESCENT_HISTORY_ACTIONS = [
  "append",
  "stay",
  "replace_previous",
] as const

export type CompassDescentHistoryAction =
  (typeof COMPASS_DESCENT_HISTORY_ACTIONS)[number]

export type CompassDescentAttempt = {
  question: string
  answer: string
  movement: MeaningMovement
  direction: MeaningDirection
}

export type CompassDescentDecision = {
  direction: MeaningDirection
  movement: MeaningMovement
  answerForm: MeaningAnswerForm
  substantiveAnswer: string | null
  historyAction: CompassDescentHistoryAction
  advanceLayer: boolean
  question: string | null
}

export type CompassDescentResolution = {
  decision: CompassDescentDecision
  displayedQuestion: string
  participantAnswer: string
}

export function isCompassDescentHistoryAction(
  value: unknown,
): value is CompassDescentHistoryAction {
  return (
    typeof value === "string" &&
    (COMPASS_DESCENT_HISTORY_ACTIONS as readonly string[]).includes(value)
  )
}
