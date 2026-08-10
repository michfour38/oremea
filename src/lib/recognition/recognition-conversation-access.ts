import { prisma } from "@/lib/prisma";
import {
  RECOGNITION_PRODUCT_KEY,
  normalizeRecognitionEmail,
  readRecognitionLedger,
} from "./recognition-access";

const ACCESS_USER_PREFIX = "recognition-email:";
const DEFAULT_RECOGNITION_OWNER_USER_ID = "user_3CLGEx3xqgXY6DsIHPyV3yOd1xi";

export type RecognitionConversationAccess = {
  active: boolean;
  source: "owner" | "purchase" | null;
  matchedEmail: string | null;
  purchasedAt: Date | null;
};

export function isRecognitionOwner(userId: string) {
  const configured = process.env.RECOGNITION_OWNER_USER_ID?.trim();
  return userId === (configured || DEFAULT_RECOGNITION_OWNER_USER_ID);
}

export async function getRecognitionConversationAccess({
  userId,
  emails,
}: {
  userId: string;
  emails: string[];
}): Promise<RecognitionConversationAccess> {
  if (isRecognitionOwner(userId)) {
    return {
      active: true,
      source: "owner",
      matchedEmail: normalizeRecognitionEmail(emails[0] ?? "") || null,
      purchasedAt: null,
    };
  }

  const normalizedEmails = Array.from(
    new Set(
      emails
        .map(normalizeRecognitionEmail)
        .filter((email) => email.length > 0 && email.includes("@")),
    ),
  );

  if (normalizedEmails.length === 0) {
    return { active: false, source: null, matchedEmail: null, purchasedAt: null };
  }

  const entitlements = await prisma.oremea_entitlements.findMany({
    where: {
      product_key: RECOGNITION_PRODUCT_KEY,
      user_id: {
        in: normalizedEmails.map((email) => `${ACCESS_USER_PREFIX}${email}`),
      },
      status: "active",
      revoked_at: null,
    },
    select: {
      user_id: true,
      source_reference: true,
      granted_at: true,
    },
  });

  for (const entitlement of entitlements) {
    const ledger = readRecognitionLedger(entitlement.source_reference);
    if (ledger.payments.length === 0) continue;

    const matchedEmail = entitlement.user_id.startsWith(ACCESS_USER_PREFIX)
      ? entitlement.user_id.slice(ACCESS_USER_PREFIX.length)
      : null;
    const latestPayment = [...ledger.payments]
      .sort((a, b) => Date.parse(b.paidAt) - Date.parse(a.paidAt))[0];

    return {
      active: true,
      source: "purchase",
      matchedEmail,
      purchasedAt: latestPayment?.paidAt
        ? new Date(latestPayment.paidAt)
        : entitlement.granted_at,
    };
  }

  return { active: false, source: null, matchedEmail: null, purchasedAt: null };
}
