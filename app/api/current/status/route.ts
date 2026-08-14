import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  getCurrentAccessState,
  getCurrentLaunchState,
  getOremeaMemberState,
  getRecognitionCurrentQualificationTurns,
  listPendingCurrentInvitations,
  qualifyForCurrent,
} from "@/src/lib/current/current-access";
import { getActiveRecognitionThread } from "@/src/lib/recognition/recognition-thread";

export const dynamic = "force-dynamic";

function userEmails(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return [];
  return user.emailAddresses
    .map((item) => item.emailAddress.trim().toLowerCase())
    .filter(Boolean);
}

async function qualifyRecognitionParticipation(userId: string) {
  const thread = await getActiveRecognitionThread(userId);

  if (!thread) return;

  const completedUserTurns = Math.floor(thread.message_count / 2);
  const requiredTurns = getRecognitionCurrentQualificationTurns();
  if (completedUserTurns < requiredTurns) return;

  await qualifyForCurrent({
    userId,
    sourceProduct: "recognition",
    sourceInstanceId: thread.id,
    triggerKey: `recognition_${requiredTurns}_completed_exchanges`,
  });
}

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ member: false }, { status: 401 });
    }

    const user = await currentUser();
    const memberState = await getOremeaMemberState({
      userId,
      emails: userEmails(user),
    });

    if (!memberState.member) {
      return NextResponse.json({ member: false });
    }

    // Recognition is recursive rather than a fixed-length course now. Meaningful
    // participation is measured by completed user↔Recognition exchanges, and only
    // the active chat can qualify. The qualification itself remains idempotent.
    await qualifyRecognitionParticipation(userId);

    const [launch, access, pendingInvitations] = await Promise.all([
      getCurrentLaunchState(),
      getCurrentAccessState(userId),
      listPendingCurrentInvitations(userId),
    ]);

    return NextResponse.json({
      member: true,
      launched: launch.launched,
      current: {
        active: access.active,
        expiresAt: access.expiresAt?.toISOString() ?? null,
        accessUrl: access.accessUrl,
        checkoutAvailable:
          launch.launched && Boolean(process.env.CURRENT_CHECKOUT_URL?.trim()),
      },
      pendingInvitations: pendingInvitations.map((invitation) => ({
        id: invitation.id,
        sourceProduct: invitation.source_product,
        sourceInstanceId: invitation.source_instance_id,
        triggerKey: invitation.trigger_key,
        checkoutStartedAt:
          invitation.checkout_started_at?.toISOString() ?? null,
        createdAt: invitation.created_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/current/status failed:", error);
    return NextResponse.json(
      { member: false, error: "The Current status could not be loaded." },
      { status: 500 },
    );
  }
}
