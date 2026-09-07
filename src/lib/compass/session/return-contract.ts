import {
  createEmptyCompassEndingState,
  type CompassEndingState,
  type CompassMapItem,
  type CompassMovement,
} from "../ending/ending-types"

function participantText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function buildCompassReturnOpening({
  resolutionText,
  chosenMovement,
}: {
  resolutionText: unknown
  chosenMovement: unknown
}): string {
  const resolution = participantText(resolutionText)
  const movement = participantText(chosenMovement)

  if (!resolution && !movement) {
    return "What has changed since we last spoke?"
  }

  const evidence = [
    resolution ? `Last time, you resolved:\n\n${resolution}` : null,
    movement ? `You chose this movement:\n\n${movement}` : null,
    "What actually happened, and what has changed since we last spoke?",
  ]

  return evidence.filter((item): item is string => Boolean(item)).join("\n\n")
}

export function carryCompassEndingStateForReturn({
  storedState,
  chosenMovement,
  movementId,
  now,
}: {
  storedState: unknown
  chosenMovement: unknown
  movementId: string
  now: string
}): CompassEndingState {
  const empty = createEmptyCompassEndingState()
  const source =
    storedState &&
    typeof storedState === "object" &&
    !Array.isArray(storedState) &&
    (storedState as Record<string, unknown>).version === 1
      ? (storedState as Partial<CompassEndingState>)
      : null

  const mapItems = Array.isArray(source?.mapItems)
    ? (source.mapItems as CompassMapItem[])
    : []
  const movements = Array.isArray(source?.movements)
    ? (source.movements as CompassMovement[])
    : []
  const movement = participantText(chosenMovement)
  const previousCurrent = source?.currentMovementId
    ? movements.find((item) => item.id === source.currentMovementId)
    : null

  let carriedMovements = movements
  let currentMovementId: string | null = null

  if (movement) {
    if (previousCurrent) {
      currentMovementId = previousCurrent.id
      carriedMovements = movements.map((item) =>
        item.id === previousCurrent.id
          ? {
              ...item,
              instruction: movement,
              status: "active" as const,
              completedAt: null,
            }
          : item,
      )
    } else {
      currentMovementId = movementId
      carriedMovements = [
        ...movements,
        {
          id: movementId,
          mapItemId: null,
          instruction: movement,
          reason: null,
          status: "active",
          createdAt: now,
          completedAt: null,
        },
      ]
    }
  }

  return {
    ...empty,
    selectedArea:
      typeof source?.selectedArea === "string" ? source.selectedArea : null,
    mapItems,
    mapReviewed: false,
    movements: carriedMovements,
    currentMovementId,
    reframe: null,
    resolutionCandidate: null,
    resolutionConfirmed: false,
    resolutionConfirmedAt: null,
    followUpQuestion: null,
    movementReady: false,
    scopeCategory: "in_scope",
    discussionCount: 1,
    updatedAt: now,
  }
}
