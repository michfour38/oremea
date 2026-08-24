import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const INVITE_EXPIRY_DAYS = 14

function createExpiryDate() {
  const expiresAt = new Date()

  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

  return expiresAt
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

export async function POST(request: Request) {
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

    const body = await request.json()

    const systemId =
      typeof body.systemId === "string"
        ? body.systemId.trim()
        : ""

    const submittedInvites = Array.isArray(body.invites)
      ? body.invites
      : []

    if (!systemId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing systemId",
        },
        { status: 400 },
      )
    }

    const system = await prisma.harmonize_systems.findFirst({
      where: {
        id: systemId,
        owner_profile_id: userId,
        status: "active",
      },
      select: {
        id: true,
      },
    })

    if (!system) {
      return NextResponse.json(
        {
          success: false,
          error: "Relationship Space not found or access denied",
        },
        { status: 404 },
      )
    }

    const inviteMap = new Map<
      string,
      {
        email: string
        relationshipContext: string | null
      }
    >()

    for (const submittedInvite of submittedInvites) {
      const email = cleanEmail(submittedInvite?.email)

      if (!email || !email.includes("@")) {
        continue
      }

      const relationshipContext =
        typeof submittedInvite?.relationshipContext === "string"
          ? submittedInvite.relationshipContext.trim() || null
          : null

      inviteMap.set(email, {
        email,
        relationshipContext,
      })
    }

    const cleanedInvites = Array.from(inviteMap.values())

    if (!cleanedInvites.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid invitation email addresses were provided",
        },
        { status: 400 },
      )
    }

    const expiresAt = createExpiryDate()

    const invitations = await prisma.$transaction(
  async (transaction) => {
    return Promise.all(
      cleanedInvites.map(async (invite) => {
        const existingInvite =
          await transaction.harmonize_invites.findFirst({
            where: {
              system_id: systemId,
              email: invite.email,
              status: "pending",
            },
            orderBy: {
              created_at: "desc",
            },
            select: {
              id: true,
            },
          })

        if (existingInvite) {
          return transaction.harmonize_invites.update({
            where: {
              id: existingInvite.id,
            },
            data: {
              relationship_context:
                invite.relationshipContext,
              expires_at: expiresAt,
              revoked_at: null,
              accepted_at: null,
              accepted_by_profile_id: null,
              consent_acknowledged_at: null,
              status: "pending",
            },
            select: {
              id: true,
              system_id: true,
              email: true,
              relationship_context: true,
              status: true,
              created_at: true,
              expires_at: true,
            },
          })
        }

        return transaction.harmonize_invites.create({
          data: {
            system_id: systemId,
            email: invite.email,
            relationship_context:
              invite.relationshipContext,
            status: "pending",
            expires_at: expiresAt,
          },
          select: {
            id: true,
            system_id: true,
            email: true,
            relationship_context: true,
            status: true,
            created_at: true,
            expires_at: true,
          },
        })
      }),
    )
  },
)

    return NextResponse.json({
      success: true,
      invitations,
    })
  } catch (error) {
    console.error("POST /api/harmonize/invite failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create invitations",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
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

    const body = await request.json()

    const inviteId =
      typeof body.inviteId === "string"
        ? body.inviteId.trim()
        : ""

    if (!inviteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing inviteId",
        },
        { status: 400 },
      )
    }

    const invitation =
      await prisma.harmonize_invites.findFirst({
        where: {
          id: inviteId,
          systems: {
            owner_profile_id: userId,
          },
        },
        select: {
          id: true,
          status: true,
        },
      })

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          error: "Invitation not found or access denied",
        },
        { status: 404 },
      )
    }

    if (invitation.status === "accepted") {
      return NextResponse.json(
        {
          success: false,
          error:
            "An accepted invitation cannot be revoked",
        },
        { status: 409 },
      )
    }

    if (invitation.status === "revoked") {
      return NextResponse.json({
        success: true,
        invitation,
      })
    }

    const revokedInvitation =
      await prisma.harmonize_invites.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: "revoked",
          revoked_at: new Date(),
        },
        select: {
          id: true,
          status: true,
          revoked_at: true,
        },
      })

    return NextResponse.json({
      success: true,
      invitation: revokedInvitation,
    })
  } catch (error) {
    console.error(
      "DELETE /api/harmonize/invite failed:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error: "Failed to revoke invitation",
      },
      { status: 500 },
    )
  }
}