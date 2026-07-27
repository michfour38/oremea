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

    let state = readState(session.detected_patterns, session.selected_area)

    if (action === "refresh_map" || action === "make_workable") {
      const result = await runCompassEndingEngine({
        mode: action === "make_workable" ? "movement" : "map",
        selectedArea: session.selected_area,
        areaResponses: session.area_responses,
        recursiveLayers: session.recursive_layers,
        possibilityAnswers: session.possibility_answers,
        discussionMessages: session.discussion_messages,
        existingMapItems: state.mapItems,
        movements: state.movements,
      })

      if (!result) {
        return NextResponse.json(
          { error: "Compass could not build the ending yet." },
          { status: 502 },
        )
      }

      state = {
        ...state,
        selectedArea: session.selected_area,
        scopeCategory: result.scopeCategory,
        discussionCount: countDiscussionMessages(session.discussion_messages),
        updatedAt: new Date().toISOString(),
      }

      if (result.scopeCategory === "in_scope") {
        state.mapItems = mergeMapItems(state.mapItems, result.mapItems)
        state.reframe = result.reframe
        state.followUpQuestion = result.followUpQuestion

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
      }
    } else if (action === "complete_item") {
      const itemId = typeof body.itemId === "string" ? body.itemId : ""
      const now = new Date().toISOString()

      state.mapItems = state.mapItems.map((item) =>
        item.id === itemId
          ? { ...item, status: "completed" as const, completedAt: now }
          : item,
      )
      state.updatedAt = now
    } else if (action === "release_item") {
      const itemId = typeof body.itemId === "string" ? body.itemId : ""
      state.mapItems = state.mapItems.map((item) =>
        item.id === itemId
          ? { ...item, status: "released" as const }
          : item,
      )
      state.updatedAt = new Date().toISOString()
    } else if (action === "edit_item") {
      const itemId = typeof body.itemId === "string" ? body.itemId : ""
      const content = typeof body.content === "string" ? body.content.trim() : ""

      if (content) {
        state.mapItems = state.mapItems.map((item) =>
          item.id === itemId ? { ...item, content } : item,
        )
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
        state.followUpQuestion = "Okay. What did I get wrong?"
      } else if (feedback === "blocked") {
        state.movements = state.movements.map((movement) =>
          movement.id === movementId
            ? { ...movement, status: "blocked" as const }
            : movement,
        )
        state.currentMovementId = null
        state.followUpQuestion = "What's getting in the way of this one?"
      } else if (feedback === "easier") {
        state.followUpQuestion = "What part of this still feels like too much?"
      }

      state.updatedAt = new Date().toISOString()
    }

    await prisma.compass_sessions.update({
      where: { id: session.id },
      data: {
        detected_patterns: state as object,
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
    movements: Array.isArray(row.movements)
      ? (row.movements as CompassMovement[])
      : [],
    currentMovementId:
      typeof row.currentMovementId === "string" ? row.currentMovementId : null,
    reframe: typeof row.reframe === "string" ? row.reframe : null,
    followUpQuestion:
      typeof row.followUpQuestion === "string" ? row.followUpQuestion : null,
    scopeCategory,
    discussionCount:
      typeof row.discussionCount === "number" ? row.discussionCount : 0,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : empty.updatedAt,
  }
}

function mergeMapItems(
  existing: CompassMapItem[],
  candidates: CompassMapCandidate[],
): CompassMapItem[] {
  const now = new Date().toISOString()
  const merged = [...existing]

  for (const candidate of candidates) {
    const key = normalize(candidate.content)
    const index = merged.findIndex((item) => normalize(item.content) === key)

    if (index >= 0) {
      const current = merged[index]
      merged[index] = {
        ...current,
        kind: candidate.kind,
        ownership: candidate.ownership,
        area: candidate.area ?? current.area,
        sourceMessageIndex:
          candidate.sourceMessageIndex ?? current.sourceMessageIndex,
        sourceSnippet: candidate.sourceSnippet ?? current.sourceSnippet,
      }
      continue
    }

    merged.push({
      id: crypto.randomUUID(),
      content: candidate.content,
      kind: candidate.kind,
      ownership: candidate.ownership,
      status: candidate.kind === "waiting" ? "waiting" : "active",
      area: candidate.area,
      sourceMessageIndex: candidate.sourceMessageIndex,
      sourceSnippet: candidate.sourceSnippet,
      createdAt: now,
      completedAt: null,
    })
  }

  return merged
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
