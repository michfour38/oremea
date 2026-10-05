import { prisma } from "@/lib/prisma";

export async function getAccountDeletionExtraBlockers({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const [
    ownedSystems,
    participations,
    harmonizeInvites,
    partyRegistrations,
    creatorSilverKeys,
  ] = await Promise.all([
    prisma.harmonize_systems.count({
      where: {
        OR: [{ created_by: userId }, { owner_profile_id: userId }],
      },
    }),
    prisma.harmonize_participants.count({ where: { profile_id: userId } }),
    prisma.harmonize_invites.count({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    }),
    prisma.oremea_party_registrations.count({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    }),
    prisma.oremea_creator_silver_key_issuances.count({
      where: {
        OR: [
          { current_user_id: userId },
          { email_normalized: normalizedEmail },
        ],
      },
    }),
  ]);

  const blockers: string[] = [];

  if (ownedSystems > 0 || participations > 0 || harmonizeInvites > 0) {
    blockers.push(
      "This account or email has Harmonize history/invitations. Resolve or deliberately archive that relationship data before deleting the identity.",
    );
  }

  if (partyRegistrations > 0) {
    blockers.push(
      "This email has Oremea event/party history. Resolve that invitation and guest-pass graph before deleting the identity.",
    );
  }

  if (creatorSilverKeys > 0) {
    blockers.push(
      "This account or email has a Creator Silver Key issuance and audit history. Preserve or deliberately resolve that key record before deleting the identity.",
    );
  }

  return blockers;
}
