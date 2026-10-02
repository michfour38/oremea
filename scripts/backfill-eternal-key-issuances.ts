import { clerkClient } from "@clerk/nextjs/server";

import { ETERNAL_OREMEA_KEY } from "@/lib/auth/account-access";
import { normalizeGoldenKeyEmail } from "@/lib/auth/golden-key-invites";
import { prisma } from "@/lib/prisma";

type BackfillResult =
  | { status: "already_protected" }
  | { status: "protected"; email: string }
  | { status: "unresolved"; reason: string };

type EternalKeyEntitlement = {
  id: string;
  user_id: string;
  source: string | null;
  source_reference: string | null;
  granted_at: Date;
};

function maskedEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(3, local.length - 1))}@${domain}`;
}

function verifiedIdentityEmail(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>) {
  const verified = user.emailAddresses.filter(
    (email) => email.verification?.status === "verified",
  );
  const primary = user.primaryEmailAddress;

  if (primary?.verification?.status === "verified") {
    return normalizeGoldenKeyEmail(primary.emailAddress);
  }

  if (verified.length === 1) {
    return normalizeGoldenKeyEmail(verified[0].emailAddress);
  }

  return null;
}

async function protectedIssuanceId(entitlement: EternalKeyEntitlement) {
  if (
    entitlement.source !== "eternal_key_issuance" ||
    !entitlement.source_reference
  ) {
    return null;
  }

  const issuance = await prisma.oremea_eternal_key_issuances.findUnique({
    where: { id: entitlement.source_reference },
    select: { id: true, current_user_id: true },
  });

  return issuance?.current_user_id === entitlement.user_id
    ? issuance.id
    : null;
}

async function backfillEntitlement(
  entitlement: EternalKeyEntitlement,
  client: Awaited<ReturnType<typeof clerkClient>>,
): Promise<BackfillResult> {
  if (await protectedIssuanceId(entitlement)) {
    return { status: "already_protected" };
  }

  let user;
  try {
    user = await client.users.getUser(entitlement.user_id);
  } catch {
    return { status: "unresolved", reason: "clerk_user_unavailable" };
  }

  const email = verifiedIdentityEmail(user);
  if (!email) {
    return {
      status: "unresolved",
      reason: "no_unambiguous_verified_email",
    };
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.oremea_entitlements.findUnique({
      where: { id: entitlement.id },
      select: {
        id: true,
        user_id: true,
        product_key: true,
        status: true,
        source: true,
        source_reference: true,
        granted_at: true,
        expires_at: true,
        revoked_at: true,
      },
    });

    if (
      !current ||
      current.product_key !== ETERNAL_OREMEA_KEY ||
      current.status !== "active" ||
      current.revoked_at ||
      current.expires_at
    ) {
      return { status: "already_protected" } as const;
    }

    if (
      current.source === "eternal_key_issuance" &&
      current.source_reference
    ) {
      const linked = await tx.oremea_eternal_key_issuances.findUnique({
        where: { id: current.source_reference },
        select: { current_user_id: true },
      });

      if (linked?.current_user_id === current.user_id) {
        return { status: "already_protected" } as const;
      }
    }

    const existingIssuance =
      await tx.oremea_eternal_key_issuances.findUnique({
        where: { email_normalized: email },
      });

    if (
      existingIssuance?.current_user_id &&
      existingIssuance.current_user_id !== current.user_id
    ) {
      return {
        status: "unresolved",
        reason: "verified_email_attached_to_another_key_holder",
      } as const;
    }

    const now = new Date();
    const issuance = existingIssuance
      ? await tx.oremea_eternal_key_issuances.update({
          where: { id: existingIssuance.id },
          data: {
            current_user_id: current.user_id,
            attached_at: existingIssuance.attached_at ?? now,
          },
        })
      : await tx.oremea_eternal_key_issuances.create({
          data: {
            email_normalized: email,
            granted_by:
              current.source === "admin_eternal_key"
                ? current.source_reference
                : null,
            granted_at: current.granted_at,
            current_user_id: current.user_id,
            attached_at: now,
          },
        });

    await tx.oremea_entitlements.update({
      where: { id: current.id },
      data: {
        source: "eternal_key_issuance",
        source_reference: issuance.id,
      },
    });

    return { status: "protected", email } as const;
  });
}

async function main() {
  const entitlements = await prisma.oremea_entitlements.findMany({
    where: {
      product_key: ETERNAL_OREMEA_KEY,
      status: "active",
      revoked_at: null,
      expires_at: null,
    },
    select: {
      id: true,
      user_id: true,
      source: true,
      source_reference: true,
      granted_at: true,
    },
    orderBy: { granted_at: "asc" },
  });

  if (!entitlements.length) {
    console.log("[golden-key-backfill] No active Golden Keys found.");
    return;
  }

  const client = await clerkClient();
  const summary = {
    active: entitlements.length,
    protected: 0,
    alreadyProtected: 0,
    unresolved: 0,
  };

  for (const entitlement of entitlements) {
    const result = await backfillEntitlement(entitlement, client);

    if (result.status === "protected") {
      summary.protected += 1;
      console.log(
        `[golden-key-backfill] Protected ${entitlement.user_id} as ${maskedEmail(result.email)}.`,
      );
      continue;
    }

    if (result.status === "already_protected") {
      summary.alreadyProtected += 1;
      continue;
    }

    summary.unresolved += 1;
    console.warn(
      `[golden-key-backfill] Could not protect ${entitlement.user_id}: ${result.reason}.`,
    );
  }

  console.log(`[golden-key-backfill] ${JSON.stringify(summary)}`);

  if (summary.unresolved) {
    console.warn(
      "[golden-key-backfill] Unresolved legacy Keys remain active; no entitlement was revoked or moved. They will be retried on the next production deploy.",
    );
  }
}

main()
  .catch((error) => {
    console.error("[golden-key-backfill] Fatal backfill error.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
