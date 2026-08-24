import {
  auth,
  currentUser,
} from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const RELATIONSHIP_SPACE_CONSENT_VERSION =
  "2026-07-17"

const RELATIONSHIP_SPACE_CONSENT_TEXT =
  "Private Witness remains private. Nothing written privately is automatically shared. Shared understanding only develops through intentional participation."

function createConsentSnapshot() {
  return {
    agreement: "harmonize_relationship_space",
    version:
      RELATIONSHIP_SPACE_CONSENT_VERSION,
    text: RELATIONSHIP_SPACE_CONSENT_TEXT,
    acknowledged: true,
  }
}

function cleanEmail(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function inviteHasExpired(
  expiresAt: Date | null,
) {
  return Boolean(
    expiresAt &&
      expiresAt.getTime() <= Date.now(),
  )
}

function getClerkEmails(
  user:
    | Awaited<ReturnType<typeof currentUser>>
    | null,
) {
  if (!user) return []

  return user.emailAddresses.map((email) =>
    cleanEmail(email.emailAddress),
  )
}

function getDisplayName(
  user:
    | Awaited<ReturnType<typeof currentUser>>
    | null,
) {
  if (!user) {
    return "Harmonize participant"
  }

  const fullName = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  return (
    fullName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    "Harmonize participant"
  )
}

class InviteClaimError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InviteClaimError"
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    const url = new URL(request.url)

    const systemId =
      url.searchParams
        .get("systemId")
        ?.trim() || ""

    const inviteId =
      url.searchParams
        .get("inviteId")
        ?.trim() || ""

    if (!systemId || !inviteId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing invitation details",
        },
        { status: 400 },
      )
    }

    const invitation =
      await prisma.harmonize_invites.findFirst({
        where: {
          id: inviteId,
          system_id: systemId,
        },
        select: {
          id: true,
          email: true,
          relationship_context: true,
          status: true,
          created_at: true,
          accepted_at: true,
          accepted_by_profile_id: true,
          consent_acknowledged_at: true,
          expires_at: true,
          revoked_at: true,
          systems: {
            select: {
              id: true,
              name: true,
              mode: true,
              status: true,
            },
          },
        },
      })

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          state: "unavailable",
          error:
            "This invitation could not be found.",
        },
        { status: 404 },
      )
    }

    const system = invitation.systems

    if (system.status !== "active") {
      return NextResponse.json({
        success: true,
        state: "unavailable",
        invitation: {
          id: invitation.id,
          invitedEmail:
            invitation.email,
          relationshipContext:
            invitation.relationship_context,
          status: invitation.status,
          expiresAt:
            invitation.expires_at,
        },
        system: {
          id: system.id,
          name: system.name,
          mode: system.mode,
        },
      })
    }

    const expired =
      invitation.status === "expired" ||
      inviteHasExpired(
        invitation.expires_at,
      )

    if (
      expired &&
      invitation.status === "pending"
    ) {
      await prisma.harmonize_invites.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: "expired",
        },
      })
    }

    let existingParticipant = null

    if (userId) {
      existingParticipant =
        await prisma.harmonize_participants.findUnique(
          {
            where: {
              system_id_profile_id: {
                system_id: systemId,
                profile_id: userId,
              },
            },
            select: {
              id: true,
              active: true,
            },
          },
        )
    }

    const clerkUser = userId
      ? await currentUser()
      : null

    const signedInEmails =
      getClerkEmails(clerkUser)

    const accountMatches =
      !userId ||
      signedInEmails.includes(
        cleanEmail(invitation.email),
      )

    let state:
      | "ready"
      | "signed_out"
      | "wrong_account"
      | "already_participant"
      | "accepted"
      | "revoked"
      | "expired"
      | "unavailable"

    if (
      existingParticipant?.active ||
      invitation.accepted_by_profile_id ===
        userId
    ) {
      state = "already_participant"
    } else if (
      invitation.status === "revoked"
    ) {
      state = "revoked"
    } else if (expired) {
      state = "expired"
    } else if (
      invitation.status === "accepted"
    ) {
      state = "accepted"
    } else if (!userId) {
      state = "signed_out"
    } else if (!accountMatches) {
      state = "wrong_account"
    } else if (
      invitation.status === "pending"
    ) {
      state = "ready"
    } else {
      state = "unavailable"
    }

    return NextResponse.json({
      success: true,
      state,
      invitation: {
        id: invitation.id,
        invitedEmail:
          invitation.email,
        relationshipContext:
          invitation.relationship_context,
        status: expired
          ? "expired"
          : invitation.status,
        createdAt:
          invitation.created_at,
        acceptedAt:
          invitation.accepted_at,
        expiresAt:
          invitation.expires_at,
      },
      system: {
        id: system.id,
        name: system.name,
        mode: system.mode,
      },
      signedInEmail:
        clerkUser?.primaryEmailAddress
          ?.emailAddress || null,
    })
  } catch (error) {
    console.error(
      "GET /api/harmonize/join failed:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load this invitation",
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
) {
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

    const inviteId =
      typeof body.inviteId === "string"
        ? body.inviteId.trim()
        : ""

    const consentAcknowledged =
      body.consentAcknowledged === true

    if (!systemId || !inviteId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing invitation details",
        },
        { status: 400 },
      )
    }

    if (!consentAcknowledged) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please acknowledge how privacy and sharing work before joining.",
        },
        { status: 400 },
      )
    }

    const invitation =
      await prisma.harmonize_invites.findFirst({
        where: {
          id: inviteId,
          system_id: systemId,
        },
        select: {
          id: true,
          email: true,
          relationship_context: true,
          status: true,
          expires_at: true,
          accepted_by_profile_id: true,
          systems: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      })

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This invitation could not be found.",
        },
        { status: 404 },
      )
    }

    if (
      invitation.systems.status !==
      "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This Relationship Space is no longer available.",
        },
        { status: 409 },
      )
    }

    const existingParticipant =
      await prisma.harmonize_participants.findUnique(
        {
          where: {
            system_id_profile_id: {
              system_id: systemId,
              profile_id: userId,
            },
          },
        },
      )

    if (existingParticipant?.active) {
      return NextResponse.json({
        success: true,
        alreadyParticipant: true,
        participant: existingParticipant,
      })
    }

    if (
      invitation.status === "accepted" &&
      invitation.accepted_by_profile_id ===
        userId
    ) {
      return NextResponse.json({
        success: true,
        alreadyParticipant: true,
      })
    }

    if (
      invitation.status === "revoked"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This invitation has been revoked.",
        },
        { status: 409 },
      )
    }

    if (
      invitation.status === "expired" ||
      inviteHasExpired(
        invitation.expires_at,
      )
    ) {
      if (
        invitation.status === "pending"
      ) {
        await prisma.harmonize_invites.update(
          {
            where: {
              id: invitation.id,
            },
            data: {
              status: "expired",
            },
          },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "This invitation has expired.",
        },
        { status: 409 },
      )
    }

    if (
      invitation.status === "accepted"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This invitation has already been accepted.",
        },
        { status: 409 },
      )
    }

    if (
      invitation.status !== "pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This invitation is no longer available.",
        },
        { status: 409 },
      )
    }

    const clerkUser =
      await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to confirm the signed-in account.",
        },
        { status: 401 },
      )
    }

    const userEmails =
      getClerkEmails(clerkUser)

    const invitedEmail =
      cleanEmail(invitation.email)

    if (
      !userEmails.includes(invitedEmail)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "WRONG_ACCOUNT",
          error:
            "This invitation was sent to another account. Sign in with the invited account.",
          invitedEmail:
            invitation.email,
          signedInEmail:
            clerkUser.primaryEmailAddress
              ?.emailAddress || null,
        },
        { status: 403 },
      )
    }

    await prisma.profiles.upsert({
      where: {
        id: userId,
      },
      update: {},
      create: {
        id: userId,
        display_name:
          getDisplayName(clerkUser),
        pathway: "harmonize",
        updated_at: new Date(),
      },
    })

    const now = new Date()
    const consentSnapshot =
      createConsentSnapshot()

    const participant =
      await prisma.$transaction(
        async (transaction) => {
          const claimedInvitation =
            await transaction.harmonize_invites.updateMany(
              {
                where: {
                  id: inviteId,
                  system_id: systemId,
                  status: "pending",
                  OR: [
                    {
                      expires_at: null,
                    },
                    {
                      expires_at: {
                        gt: now,
                      },
                    },
                  ],
                },
                data: {
                  status: "accepted",
                  accepted_at: now,
                  accepted_by_profile_id:
                    userId,
                  consent_acknowledged_at:
                    now,
                },
              },
            )

          if (
            claimedInvitation.count !== 1
          ) {
            throw new InviteClaimError(
              "This invitation is no longer available.",
            )
          }

          return transaction.harmonize_participants.upsert(
            {
              where: {
                system_id_profile_id: {
                  system_id: systemId,
                  profile_id: userId,
                },
              },
              update: {
                active: true,
                relationship_context:
                  invitation.relationship_context,
                consent_snapshot:
                  consentSnapshot,
                consent_acknowledged_at:
                  now,
              },
              create: {
                system_id: systemId,
                profile_id: userId,
                role: "other",
                relationship_context:
                  invitation.relationship_context,
                consent_snapshot:
                  consentSnapshot,
                consent_acknowledged_at:
                  now,
              },
            },
          )
        },
      )

    return NextResponse.json({
      success: true,
      participant,
    })
  } catch (error) {
    console.error(
      "POST /api/harmonize/join failed:",
      error,
    )

    if (
      error instanceof InviteClaimError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to join this Relationship Space",
      },
      { status: 500 },
    )
  }
}