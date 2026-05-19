import { prisma } from "@/lib/prisma"

export type CompassSessionSaveInput = {
  userId: string
  phase?: string
  selectedArea?: string | null
  areaResponses?: unknown
  recursiveLayers?: unknown
  resistanceMap?: unknown
  discussionMessages?: unknown
  proposedStep?: string | null
  finalStep?: string | null
  detectedPatterns?: unknown
}

export async function getActiveCompassSession(userId: string) {
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

export async function createStoredCompassSession(userId: string) {
  return prisma.compass_sessions.create({
    data: {
      user_id: userId,
      status: "active",
      phase: "intro",
    },
  })
}

export async function saveCompassSession({
  userId,
  phase,
  selectedArea,
  areaResponses,
  recursiveLayers,
  resistanceMap,
  discussionMessages,
  proposedStep,
  finalStep,
  detectedPatterns,
}: CompassSessionSaveInput) {
  const existing = await getActiveCompassSession(userId)

  if (!existing) {
    return prisma.compass_sessions.create({
      data: {
        user_id: userId,
        status: "active",
        phase,
        selected_area: selectedArea,
        area_responses: areaResponses as object,
        recursive_layers: recursiveLayers as object,
        resistance_map: resistanceMap as object,
        discussion_messages: discussionMessages as object,
        proposed_step: proposedStep,
        final_step: finalStep,
        detected_patterns: detectedPatterns as object,
      },
    })
  }

  return prisma.compass_sessions.update({
    where: {
      id: existing.id,
    },
    data: {
      phase,
      selected_area: selectedArea,
      area_responses: areaResponses as object,
      recursive_layers: recursiveLayers as object,
      resistance_map: resistanceMap as object,
      discussion_messages: discussionMessages as object,
      proposed_step: proposedStep,
      final_step: finalStep,
      detected_patterns: detectedPatterns as object,
    },
  })
}

export async function completeCompassSession(userId: string) {
  const existing = await getActiveCompassSession(userId)

  if (!existing) {
    return null
  }

  return prisma.compass_sessions.update({
    where: {
      id: existing.id,
    },
    data: {
      status: "complete",
    },
  })
}