import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const INVITE_LIFETIME_MS =
  14 * 24 * 60 * 60 * 1000

function effectiveExpiry(
  createdAt: Date,
  expiresAt: Date | null,
) {
  return (
    expiresAt ??
    new Date(
      createdAt.getTime() +
        INVITE_LIFETIME_MS,
    )
  )
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(
      request.url,
    )

    const systemId =
      searchParams.get("systemId")?.trim() ||
      ""

    if (!systemId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing systemId",
        },
        { status: 400 },
      )
    }

    const system =
      await prisma.harmonize_systems.findFirst({
        where: {
          id: systemId,
          participants: {
            some: {
              profile_id: userId,
              active: true,
            },
          },
        },
        select: {
          id: true,
          owner_profile_id: true,
          mode: true,
          name: true,
          status: true,
          consent_snapshot: true,
          created_by: true,
          created_at: true,
          updated_at: true,

          participants: {
            where: {
              active: true,
            },
            include: {
              profiles: {
                select: {
                  display_name: true,
                },
              },
            },
            orderBy: {
              created_at: "asc",
            },
          },

          invites: {
            where: {
              status: "pending",
            },
            orderBy: {
              created_at: "asc",
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
        {
          success: false,
          error:
            "Relationship Space not found or access denied",
        },
        { status: 404 },
      )
    }

    const now = Date.now()

    const expiredInviteIds =
      system.invites
        .filter((invite) => {
          const expiresAt = effectiveExpiry(
            invite.created_at,
            invite.expires_at,
          )

          return expiresAt.getTime() <= now
        })
        .map((invite) => invite.id)

    if (expiredInviteIds.length > 0) {
      await prisma.harmonize_invites.updateMany({
        where: {
          id: {
            in: expiredInviteIds,
          },
          status: "pending",
        },
        data: {
          status: "expired",
        },
      })
    }

    const activePendingInvites =
      system.invites.filter(
        (invite) =>
          !expiredInviteIds.includes(invite.id),
      )

    const participants =
      system.participants.map(
        (participant) => ({
          id: participant.id,
          profileId:
            participant.profile_id,
          isCurrentUser:
            participant.profile_id === userId,
          isOwner:
            participant.profile_id ===
            system.owner_profile_id,
          displayName:
            participant.profile_id === userId
              ? "You"
              : participant.profiles.display_name?.trim() ||
                "Participant",
          relationshipContext:
            participant.relationship_context,
          joinedAt:
            participant.created_at,
        }),
      )

    const pendingInvitations =
      activePendingInvites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        relationshipContext:
          invite.relationship_context,
        status: invite.status,
        invitedAt: invite.created_at,
        expiresAt: effectiveExpiry(
          invite.created_at,
          invite.expires_at,
        ),
      }))

    const cycles = system.cycles.map(
      (cycle) => {
        const myLabel =
          cycle.participant_labels?.[0]?.label

        return {
          ...cycle,
          displayTitle:
            myLabel || "Conversation",
          hasPrivateWitness:
            Boolean(myLabel),
          otherParticipants: Math.max(
            participants.length - 1,
            0,
          ),
          waitingForYou: !myLabel,
        }
      },
    )

    return NextResponse.json({
      success: true,
      system: {
        id: system.id,
        owner_profile_id:
          system.owner_profile_id,
        mode: system.mode,
        name: system.name,
        status: system.status,
        consent_snapshot:
          system.consent_snapshot,
        created_by: system.created_by,
        created_at: system.created_at,
        updated_at: system.updated_at,

        participants,
        pendingInvitations,
        cycles,

        participantCount:
          participants.length,
        pendingInvitationCount:
          pendingInvitations.length,
        occupiedPlaceCount:
          participants.length +
          pendingInvitations.length,
      },
    })
  } catch (error) {
    console.error(
      "GET /api/harmonize/system/summary failed:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load Relationship Space",
      },
      { status: 500 },
    )
  }
}