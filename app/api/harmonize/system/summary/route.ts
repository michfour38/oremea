import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const systemId = searchParams.get("systemId")

    if (!systemId) {
      return NextResponse.json({ error: "Missing systemId" }, { status: 400 })
    }

    const system = await prisma.harmonize_systems.findFirst({
      where: {
        id: systemId,
        participants: {
          some: {
            profile_id: userId,
            active: true,
          },
        },
      },
      include: {
  participants: true,
  invites: {
    orderBy: {
      created_at: "desc",
    },
  },
  cycles: {
  orderBy: {
    started_at: "desc",
  },
  include: {
    reviews: {
      orderBy: {
        created_at: "desc",
      },
      take: 1,
    },
    participant_labels: {
      where: {
        participants: {
          profile_id: userId,
        },
      },
    },
  },
},
      },
    })

    if (!system) {
      return NextResponse.json(
        { error: "System not found or access denied" },
        { status: 404 },
      )
    }

const cycles = system.cycles.map((cycle) => {
  const myLabel = cycle.participant_labels?.[0]?.label

  const participantCount = system.participants.length

  const otherParticipants = 1

  return {
    ...cycle,

    displayTitle: myLabel || "Conversation",

    hasPrivateWitness: Boolean(myLabel),

    otherParticipants,

    waitingForYou: !myLabel,
  }
})

const memory = {
  totalCycles: system.cycles.length,

  reviewedCycles: system.cycles.filter(
    (cycle) => cycle.reviews.length > 0,
  ).length,

  integrationCycles: system.cycles.filter(
    (cycle) => cycle.reviews?.[0]?.outcome === "integration",
  ).length,

  repetitionCycles: system.cycles.filter(
    (cycle) => cycle.reviews?.[0]?.outcome === "repetition",
  ).length,

  mimicryCycles: system.cycles.filter(
    (cycle) => cycle.reviews?.[0]?.outcome === "mimicry",
  ).length,
}

return NextResponse.json({
  success: true,
  system: {
  ...system,

  participants: [
  ...system.participants.map((participant) => ({
    ...participant,

    isOwner:
      participant.profile_id === system.owner_profile_id,

    isPending: false,

    displayName:
      participant.profile_id === userId
        ? "You"
        : "Participant",

    relationshipContext: participant.relationship_context,
  })),

  ...system.invites
    .filter((invite) => invite.status === "pending")
    .map((invite) => ({
      id: invite.id,
      active: false,
      isOwner: false,
      isPending: true,
      displayName: invite.email,
      relationshipContext: invite.relationship_context,
    })),
],

  cycles,
},
  memory,
})
  } catch (error) {
    console.error("GET /api/harmonize/system/summary failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to load Harmonize system" },
      { status: 500 },
    )
  }
}