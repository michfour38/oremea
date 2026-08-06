import { Prisma } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { runCompassEndingEngine } from "@/src/lib/compass/ending/ending-engine"
import {
  createEmptyCompassEndingState,
  type CompassEndingState,
  type CompassMapCandidate,
  type CompassMapItem,
  type CompassMovement,
} from "@/src/lib/compass/ending/ending-types"
import {
  getCompassBoundaryMessage,
  type CompassScopeCategory,
} from "@/src/lib/compass/scope-boundary"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await getSession(userId)

    if (!session) {
      return NextResponse.json({ state: null })
    }

    const state = readState(session.detected_patterns, session.selected_area)

    return NextResponse.json({
      state,
      boundaryMessage: getCompassBoundaryMessage(state.scopeCategory),
    })
  } catch (error) {
    console.error("GET /api/compass/ending failed:", error)
    return NextResponse.json(
      { error: "Failed to load Compass ending." },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const action = typeof body.action === "string" ? body.action : "refresh_map"
    const session = await getSession(userId)

    if (!session) {
      return NextResponse.json(
        { error: "No active Compass session." },
        { status: 404 },
      )
    }

    const currentDiscussionMessages = Array.isArray(body.discussionMessages)
      ? body.discussionMessages.filter(
          (message: unknown) =>
            Boolean(
              message &&
                typeof message === "object" &&
                typeof (message as Record<string, unknown>).content === "string" &&
                (message as Record<string, string>).content.trim() &&
                (message as Record<string, string>).content !== "...",
            ),
        )
      : session.discussion_messages

    let state = readState(session.detected_patterns, session.selected_area)

    if (action === "make_workable" && !state.mapReviewed) {
      return NextResponse.json(
        {
          error: "Review the current Map before turning it into a movement.",
          state,
        },
        { status: 409 },
      )
    }

    if (action === "make_workable" && !state.movementReady) {
      return NextResponse.json(
        {
          error: "Discussion has not yet supplied a current movement problem to make workable.",
          state,
        },
        { status: 409 },
      )
    }

    if (action === "refresh_map" || action === "make_workable") {
      const result = await runCompassEndingEngine({
        mode: action === "make_workable" ? "movement" : "map",
        selectedArea: session.selected_area,
        areaResponses: session.area_responses,
        recursiveLayers: session.recursive_layers,
        possibilityAnswers: session.possibility_answers,
        discussionMessages: currentDiscussionMessages,
        existingMapItems: state.mapItems,
        movements: state.movements,
      })

      if (!result) {
        return NextResponse.json(
          { error: "Compass could not build the Map from this discussion yet." },
          { status: 502 },
        )
      }

      state = {
        ...state,
        selectedArea: session.selected_area,
        scopeCategory: result.scopeCategory,
        discussionCount: countDiscussionMessages(currentDiscussionMessages),
        updatedAt: new Date().toISOString(),
      }

      if (result.scopeCategory === "in_scope") {
        if (action === "refresh_map") {
          const previousSignature = activeMapSignature(state.mapItems)
          const nextMapItems = reconcileMapItems(state.mapItems, result.mapItems)
          const nextSignature = activeMapSignature(nextMapItems)
          const mapChanged = previousSignature !== nextSignature

          state.mapItems = nextMapItems
          state.reframe = result.reframe
          state.followUpQuestion = result.followUpQuestion

          if (mapChanged) {
            state.mapReviewed = false
            state.movements = state.movements.map((movement) =>
              movement.status === "active"
                ? { ...movement, status: "replaced" as const }
                : movement,
            )
            state.currentMovementId = null
          }
        } else {
          state.reframe = result.reframe
          state.followUpQuestion = result.followUpQuestion
        }

        if (action === "make_workable" && result.movement) {
          const now = new Date().toISOString()
          const mapItemId = findMapItemId(
            state.mapItems,
            result.movement.mapItemContent,
          )

          state.movements = state.movements.map((movement) =>
            movement.status === "active"
              ? { ...movement, status: "replaced" as const }
              : movement,
          )

          const movement: CompassMovement = {
            id: crypto.randomUUID(),
            mapItemId,
            instruction: result.movement.instruction,
            reason: result.movement.reason,
            status: "active",
            createdAt: now,
            completedAt: null,
          }

          state.movements = [...state.movements, movement]
          state.currentMovementId = movement.id
        }
      } else {
        state.reframe = null
        state.followUpQuestion = null
        state.currentMovementId = null
        state.movementReady = false
        state.mapReviewed = false
      }
    } else if (action === "confirm_map") {
      state.mapReviewed = true
      state.updatedAt = new Date().toISOString()
    } else if (action === "complete_item") {
      const itemId = typeof body.itemId === "string" ? body.itemId : ""
      const now = new Date().toISOString()

      state.mapItems = state.mapItems.map((item) =>
        item.id === itemId
          ? { ...item, status: "completed" as const, completedAt: now }
          : item,
      )
      state.updatedAt = now
    } else if (action === "restore_item") {
      const itemId = typeof body.itemId === "string" ? body.itemId : ""
      const now = new Date().toISOString()

      state.mapItems = state.mapItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: "active" as const,
              completedAt: null,
            }
          : item,
      )
      state.mapReviewed = false
      state.updatedAt = now
    } else if (action === "release_item") {
      const itemId = typeof body.itemId === "string" ? body.itemId : ""
      state.mapItems = state.mapItems.map((item) =>
        item.id === itemId
          ? { ...item, status: "released" as const }
          : item,
      )
      state.mapReviewed = false
      state.updatedAt = new Date().toISOString()
    } else if (action === "edit_item") {
      const itemId = typeof body.itemId === "string" ? body.itemId : ""
      const content = typeof body.content === "string" ? body.content.trim() : ""

      if (content) {
        state.mapItems = state.mapItems.map((item) =>
          item.id === itemId ? { ...item, content } : item,
        )
        state.mapReviewed = false
      }
      state.updatedAt = new Date().toISOString()
    } else if (action === "complete_movement") {
      const now = new Date().toISOString()
      const movementId = state.currentMovementId

      state.movements = state.movements.map((movement) =>
        movement.id === movementId
          ? {
              ...movement,
              status: "completed" as const,
              completedAt: now,
            }
          : movement,
      )
      state.currentMovementId = null
      state.reframe = null
      state.movementReady = false
      state.followUpQuestion =
        "Great. That's done. What changed, or what has your attention now?"
      state.updatedAt = now
    } else if (action === "movement_feedback") {
      const feedback = typeof body.feedback === "string" ? body.feedback : ""
      const movementId = state.currentMovementId

      if (feedback === "wrong") {
        state.movements = state.movements.map((movement) =>
          movement.id === movementId
            ? { ...movement, status: "rejected" as const }
            : movement,
        )
        state.currentMovementId = null
        state.movementReady = false
        state.followUpQuestion = "Okay. What did I get wrong?"
      } else if (feedback === "blocked") {
        state.movements = state.movements.map((movement) =>
          movement.id === movementId
            ? { ...movement, status: "blocked" as const }
            : movement,
        )
        state.currentMovementId = null
        state.movementReady = false
        state.followUpQuestion = "What's getting in the way of this one?"
      } else if (feedback === "easier") {
        state.movementReady = false
        state.followUpQuestion = "What part of this still feels like too much?"
      }

      state.updatedAt = new Date().toISOString()
    }

    await prisma.compass_sessions.update({
      where: { id: session.id },
      data: {
        detected_patterns: state as object,
        discussion_messages:
          currentDiscussionMessages as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      state,
      boundaryMessage: getCompassBoundaryMessage(state.scopeCategory),
    })
  } catch (error) {
    console.error("POST /api/compass/ending failed:", error)
    return NextResponse.json(
      { error: "Failed to update Compass ending." },
      { status: 500 },
    )
  }
}

async function getSession(userId: string) {
  return prisma.compass_sessions.findFirst({
    where: {
      user_id: userId,
      status: "active",
    },
    orderBy: {
      updated_at: "desc",
    },
  })
}

function readState(
  value: unknown,
  selectedArea: string | null,
): CompassEndingState {
  const empty = createEmptyCompassEndingState(selectedArea)

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return empty
  }

  const row = value as Record<string, unknown>
  if (row.version !== 1) return empty

  const scopeCategory = isScopeCategory(row.scopeCategory)
    ? row.scopeCategory
    : "in_scope"

  return {
    ...empty,
    selectedArea:
      typeof row.selectedArea === "string" ? row.selectedArea : selectedArea,
    mapItems: Array.isArray(row.mapItems)
      ? (row.mapItems as CompassMapItem[])
      : [],
    mapReviewed: row.mapReviewed === true,
    movements: Array.isArray(row.movements)
      ? (row.movements as CompassMovement[])
      : [],
    currentMovementId:
      typeof row.currentMovementId === "string" ? row.currentMovementId : null,
    reframe: typeof row.reframe === "string" ? row.reframe : null,
    followUpQuestion:
      typeof row.followUpQuestion === "string" ? row.followUpQuestion : null,
    movementReady: row.movementReady === true,
    scopeCategory,
    discussionCount:
      typeof row.discussionCount === "number" ? row.discussionCount : 0,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : empty.updatedAt,
  }
}

function reconcileMapItems(
  existing: CompassMapItem[],
  candidates: CompassMapCandidate[],
): CompassMapItem[] {
  const now = new Date().toISOString()
  const historical = existing.filter(
    (item) => item.status === "completed" || item.status === "released",
  )
  const available = existing.filter(
    (item) => item.status === "active" || item.status === "waiting",
  )
  const usedIds = new Set<string>()

  const current = candidates.map((candidate) => {
    const match = available.find(
      (item) => !usedIds.has(item.id) && mapItemsMatch(item, candidate),
    )

    if (match) {
      usedIds.add(match.id)
      return {
        ...match,
        content: candidate.content,
        kind: candidate.kind,
        ownership: candidate.ownership,
        status: candidate.kind === "waiting" ? ("waiting" as const) : ("active" as const),
        area: candidate.area ?? match.area,
        sourceMessageIndex:
          candidate.sourceMessageIndex ?? match.sourceMessageIndex,
        sourceSnippet: candidate.sourceSnippet ?? match.sourceSnippet,
        completedAt: null,
      }
    }

    return {
      id: crypto.randomUUID(),
      content: candidate.content,
      kind: candidate.kind,
      ownership: candidate.ownership,
      status: candidate.kind === "waiting" ? ("waiting" as const) : ("active" as const),
      area: candidate.area,
      sourceMessageIndex: candidate.sourceMessageIndex,
      sourceSnippet: candidate.sourceSnippet,
      createdAt: now,
      completedAt: null,
    }
  })

  return [...current, ...historical]
}

function mapItemsMatch(
  item: CompassMapItem,
  candidate: CompassMapCandidate,
): boolean {
  const itemKey = normalize(item.content)
  const candidateKey = normalize(candidate.content)

  if (itemKey === candidateKey) return true

  if (
    itemKey.length >= 12 &&
    candidateKey.length >= 12 &&
    (itemKey.includes(candidateKey) || candidateKey.includes(itemKey))
  ) {
    return true
  }

  if (
    item.sourceMessageIndex != null &&
    candidate.sourceMessageIndex != null &&
    item.sourceMessageIndex === candidate.sourceMessageIndex &&
    item.area === candidate.area
  ) {
    return true
  }

  return false
}

function activeMapSignature(items: CompassMapItem[]): string {
  return items
    .filter((item) => item.status === "active" || item.status === "waiting")
    .map((item) => `${normalize(item.content)}:${item.kind}:${item.status}`)
    .join("|")
}

function findMapItemId(
  items: CompassMapItem[],
  content: string | null,
): string | null {
  if (!content) return null
  const key = normalize(content)
  const exact = items.find((item) => normalize(item.content) === key)
  if (exact) return exact.id

  const partial = items.find((item) => {
    const itemKey = normalize(item.content)
    return itemKey.includes(key) || key.includes(itemKey)
  })

  return partial?.id ?? null
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function countDiscussionMessages(value: unknown): number {
  return Array.isArray(value) ? value.length : 0
}

function isScopeCategory(value: unknown): value is CompassScopeCategory {
  return (
    value === "in_scope" ||
    value === "self_harm_intent" ||
    value === "medical" ||
    value === "legal" ||
    value === "regulated_professional"
  )
}
