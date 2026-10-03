import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const RECOGNITION_MEMBERSHIP_USER_PREFIX = "recognition-membership-email:";

export type AccountDeletionBlocker = {
  code: string;
  message: string;
};

export type AccountDeletionPreflight = {
  userId: string;
  email: string;
  canDelete: boolean;
  blockers: AccountDeletionBlocker[];
  summary: {
    profile: boolean;
    recognitionThreads: number;
    compassSessions: number;
    compassGoals: number;
    currentRecords: number;
    resonanceRuns: number;
    resonanceOrders: number;
    entitlements: number;
    goldenKey: boolean;
    entryLead: boolean;
    feedbackMessages: number;
  };
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function recognitionMembershipUserId(email: string) {
  return `${RECOGNITION_MEMBERSHIP_USER_PREFIX}${normalizeEmail(email)}`;
}

export async function getAccountDeletionPreflight({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<AccountDeletionPreflight> {
  const normalizedEmail = normalizeEmail(email);
  const syntheticRecognitionUserId = recognitionMembershipUserId(normalizedEmail);

  const [
    profile,
    recognitionThreads,
    compassSessions,
    compassGoals,
    currentInvitations,
    currentQualifications,
    resonanceRuns,
    resonanceOrders,
    entitlements,
    goldenKeyIssuance,
    entryLead,
    feedbackMessages,
    paidVisitOrders,
    paidResonanceRuns,
    whopEntitlements,
    syntheticRecognitionEntitlements,
    sharedHarmonizeOwned,
    sharedHarmonizeParticipation,
    circlePosts,
    circlePrompts,
    circleMemberships,
    postWitnesses,
    cohortMemberships,
    facilitatedCircles,
    reports,
    sharedPromptCompletions,
    externalPromptAnalyses,
    externalPromptReactions,
  ] = await Promise.all([
    prisma.profiles.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.recognition_threads.count({ where: { user_id: userId } }),
    prisma.compass_sessions.count({ where: { user_id: userId } }),
    prisma.compass_daily_goals.count({ where: { user_id: userId } }),
    prisma.current_invitations.count({ where: { user_id: userId } }),
    prisma.current_qualifications.count({ where: { user_id: userId } }),
    prisma.resonance_week_runs.count({ where: { user_id: userId } }),
    prisma.resonance_visit_orders.count({ where: { user_id: userId } }),
    prisma.oremea_entitlements.count({
      where: { user_id: { in: [userId, syntheticRecognitionUserId] } },
    }),
    prisma.oremea_eternal_key_issuances.findUnique({
      where: { email_normalized: normalizedEmail },
      select: { id: true },
    }),
    prisma.entry_leads.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        entry_paid_at: true,
        resonance_paid_at: true,
        resonance_access_granted: true,
      },
    }),
    prisma.oremea_feedback_messages.count({
      where: {
        OR: [
          { user_id: userId },
          { email: { equals: normalizedEmail, mode: "insensitive" } },
        ],
      },
    }),
    prisma.resonance_visit_orders.count({
      where: {
        user_id: userId,
        OR: [
          { paid_at: { not: null } },
          { whop_payment_id: { not: null } },
          { whop_member_id: { not: null } },
          { whop_checkout_id: { not: null } },
        ],
      },
    }),
    prisma.resonance_week_runs.count({
      where: { user_id: userId, purchase_source: "whop" },
    }),
    prisma.oremea_entitlements.count({
      where: {
        user_id: userId,
        source: { contains: "whop", mode: "insensitive" },
      },
    }),
    prisma.oremea_entitlements.count({
      where: {
        user_id: syntheticRecognitionUserId,
        source: { contains: "whop", mode: "insensitive" },
      },
    }),
    prisma.harmonize_systems.count({
      where: {
        OR: [{ created_by: userId }, { owner_profile_id: userId }],
        participants: { some: { profile_id: { not: userId } } },
      },
    }),
    prisma.harmonize_participants.count({
      where: {
        profile_id: userId,
        systems: { created_by: { not: userId } },
      },
    }),
    prisma.circle_posts.count({ where: { user_id: userId } }),
    prisma.circle_prompts.count({ where: { author_id: userId } }),
    prisma.circle_members.count({ where: { user_id: userId } }),
    prisma.post_witnesses.count({ where: { user_id: userId } }),
    prisma.cohort_members.count({ where: { user_id: userId } }),
    prisma.circles.count({ where: { facilitator_id: userId } }),
    prisma.reports.count({
      where: {
        OR: [
          { reporter_id: userId },
          { reported_user_id: userId },
          { reviewed_by: userId },
        ],
      },
    }),
    prisma.prompt_completions.count({
      where: { user_id: userId, is_shared: true },
    }),
    prisma.prompt_analyses.count({
      where: {
        author_id: { not: userId },
        prompt_completions: { user_id: userId },
      },
    }),
    prisma.prompt_reactions.count({
      where: {
        user_id: { not: userId },
        prompt_completions: { user_id: userId },
      },
    }),
  ]);

  const blockers: AccountDeletionBlocker[] = [];

  if (
    paidVisitOrders > 0 ||
    paidResonanceRuns > 0 ||
    whopEntitlements > 0 ||
    syntheticRecognitionEntitlements > 0 ||
    Boolean(
      entryLead?.entry_paid_at ||
        entryLead?.resonance_paid_at ||
        entryLead?.resonance_access_granted,
    )
  ) {
    blockers.push({
      code: "commerce",
      message:
        "Paid or Whop-backed history exists. Use a retained-ledger/anonymisation flow instead of destructive reset.",
    });
  }

  if (sharedHarmonizeOwned > 0 || sharedHarmonizeParticipation > 0) {
    blockers.push({
      code: "harmonize",
      message:
        "This account is part of shared Harmonize data. Shared participants must be resolved before deletion.",
    });
  }

  if (
    circlePosts > 0 ||
    circlePrompts > 0 ||
    circleMemberships > 0 ||
    postWitnesses > 0 ||
    cohortMemberships > 0 ||
    facilitatedCircles > 0 ||
    reports > 0
  ) {
    blockers.push({
      code: "community",
      message:
        "This account has shared community/cohort/reporting history. That shared record must be resolved before deletion.",
    });
  }

  if (
    sharedPromptCompletions > 0 ||
    externalPromptAnalyses > 0 ||
    externalPromptReactions > 0
  ) {
    blockers.push({
      code: "shared_resonance",
      message:
        "This account has Resonance material shared with or acted on by another account. Shared evidence must be resolved first.",
    });
  }

  return {
    userId,
    email: normalizedEmail,
    canDelete: blockers.length === 0,
    blockers,
    summary: {
      profile: Boolean(profile),
      recognitionThreads,
      compassSessions,
      compassGoals,
      currentRecords: currentInvitations + currentQualifications,
      resonanceRuns,
      resonanceOrders,
      entitlements,
      goldenKey: Boolean(goldenKeyIssuance),
      entryLead: Boolean(entryLead),
      feedbackMessages,
    },
  };
}

async function deleteProfilePrivateState(
  transaction: Prisma.TransactionClient,
  userId: string,
) {
  await transaction.prompt_analyses.deleteMany({
    where: {
      OR: [
        { author_id: userId },
        { prompt_completions: { user_id: userId } },
      ],
    },
  });
  await transaction.prompt_reactions.deleteMany({
    where: {
      OR: [
        { user_id: userId },
        { prompt_completions: { user_id: userId } },
      ],
    },
  });

  const reflectionSessions = await transaction.reflection_sessions.findMany({
    where: { user_id: userId },
    select: { id: true },
  });
  const reflectionSessionIds = reflectionSessions.map((item) => item.id);
  if (reflectionSessionIds.length > 0) {
    await transaction.reflection_messages.deleteMany({
      where: { session_id: { in: reflectionSessionIds } },
    });
    await transaction.inquiry_sessions.deleteMany({
      where: { reflection_session_id: { in: reflectionSessionIds } },
    });
  }

  await transaction.reflection_sessions.deleteMany({ where: { user_id: userId } });
  await transaction.journal_entries.deleteMany({ where: { user_id: userId } });
  await transaction.notifications.deleteMany({ where: { user_id: userId } });
  await transaction.user_insights.deleteMany({ where: { user_id: userId } });
  await transaction.profiles.updateMany({
    where: { invited_by: userId },
    data: { invited_by: null },
  });
}

export async function deleteOremeaAccountState({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const preflight = await getAccountDeletionPreflight({ userId, email });
  if (!preflight.canDelete) {
    throw new Error(
      `ACCOUNT_DELETE_BLOCKED:${preflight.blockers.map((item) => item.code).join(",")}`,
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const syntheticRecognitionUserId = recognitionMembershipUserId(normalizedEmail);

  await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`account-delete:${userId}`}))`;

    await deleteProfilePrivateState(transaction, userId);

    await transaction.recognition_threads.deleteMany({ where: { user_id: userId } });
    await transaction.compass_daily_goals.deleteMany({ where: { user_id: userId } });
    await transaction.compass_sessions.deleteMany({ where: { user_id: userId } });
    await transaction.current_invitations.deleteMany({ where: { user_id: userId } });
    await transaction.current_qualifications.deleteMany({ where: { user_id: userId } });

    await transaction.resonance_visit_redemptions.deleteMany({
      where: { user_id: userId },
    });
    await transaction.resonance_week_runs.deleteMany({ where: { user_id: userId } });
    await transaction.resonance_visit_orders.updateMany({
      where: { user_id: userId },
      data: { parent_id: null },
    });
    await transaction.resonance_visit_orders.deleteMany({ where: { user_id: userId } });
    await transaction.mirror_feedback.deleteMany({ where: { user_id: userId } });
    await transaction.mirror_unlocks.deleteMany({ where: { user_id: userId } });

    await transaction.oremea_feedback_messages.deleteMany({
      where: {
        OR: [
          { user_id: userId },
          { email: { equals: normalizedEmail, mode: "insensitive" } },
        ],
      },
    });

    const lead = await transaction.entry_leads.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (lead) {
      await transaction.entry_leads.delete({ where: { id: lead.id } });
    }

    await transaction.oremea_entitlements.deleteMany({
      where: { user_id: { in: [userId, syntheticRecognitionUserId] } },
    });

    await transaction.oremea_eternal_key_invites.deleteMany({
      where: { email_normalized: normalizedEmail },
    });
    await transaction.oremea_eternal_key_issuances.deleteMany({
      where: { email_normalized: normalizedEmail },
    });

    await transaction.account_security.deleteMany({ where: { user_id: userId } });
    await transaction.profiles.deleteMany({ where: { id: userId } });
  });

  return preflight.summary;
}
