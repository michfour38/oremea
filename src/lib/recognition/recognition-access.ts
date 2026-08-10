import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const RECOGNITION_PRODUCT_KEY = "recognition";

const ACCESS_USER_PREFIX = "recognition-email:";

type RecognitionPayment = {
  id: string;
  paidAt: string;
};

type RecognitionConsumption = {
  paymentId: string;
  sessionId: string;
  consumedAt: string;
};

type RecognitionLedger = {
  version: 1;
  payments: RecognitionPayment[];
  consumed: RecognitionConsumption[];
};

export class RecognitionCreditUnavailableError extends Error {
  constructor() {
    super("A paid Recognition process is required before beginning.");
    this.name = "RecognitionCreditUnavailableError";
  }
}

export function normalizeRecognitionEmail(email: string) {
  return email.trim().toLowerCase();
}

function accessUserId(email: string) {
  return `${ACCESS_USER_PREFIX}${normalizeRecognitionEmail(email)}`;
}

export function readRecognitionLedger(value: string | null): RecognitionLedger {
  if (!value) return { version: 1, payments: [], consumed: [] };

  try {
    const parsed = JSON.parse(value) as Partial<RecognitionLedger>;
    return {
      version: 1,
      payments: Array.isArray(parsed.payments)
        ? parsed.payments.filter(
            (item): item is RecognitionPayment =>
              Boolean(item && typeof item.id === "string" && typeof item.paidAt === "string"),
          )
        : [],
      consumed: Array.isArray(parsed.consumed)
        ? parsed.consumed.filter(
            (item): item is RecognitionConsumption =>
              Boolean(
                item &&
                  typeof item.paymentId === "string" &&
                  typeof item.sessionId === "string" &&
                  typeof item.consumedAt === "string",
              ),
          )
        : [],
    };
  } catch {
    return { version: 1, payments: [], consumed: [] };
  }
}

function availablePayments(ledger: RecognitionLedger) {
  const consumedIds = new Set(ledger.consumed.map((item) => item.paymentId));
  return ledger.payments.filter((payment) => !consumedIds.has(payment.id));
}

export async function getRecognitionCreditState(email: string) {
  const normalizedEmail = normalizeRecognitionEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { availableProcesses: 0, purchasedProcesses: 0, usedProcesses: 0 };
  }

  const entitlement = await prisma.oremea_entitlements.findUnique({
    where: {
      user_id_product_key: {
        user_id: accessUserId(normalizedEmail),
        product_key: RECOGNITION_PRODUCT_KEY,
      },
    },
    select: { source_reference: true },
  });

  const ledger = readRecognitionLedger(entitlement?.source_reference ?? null);
  return {
    availableProcesses: availablePayments(ledger).length,
    purchasedProcesses: ledger.payments.length,
    usedProcesses: ledger.consumed.length,
  };
}

export async function grantRecognitionCredit({
  email,
  paymentId,
  paidAt,
}: {
  email: string;
  paymentId: string;
  paidAt: Date;
}) {
  const normalizedEmail = normalizeRecognitionEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@") || !paymentId.trim()) {
    throw new Error("Recognition payment is missing a valid email or payment ID.");
  }

  return prisma.$transaction(async (transaction) => {
    const userId = accessUserId(normalizedEmail);
    const lockKey = `recognition-credit:${normalizedEmail}`;
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const existing = await transaction.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: RECOGNITION_PRODUCT_KEY,
        },
      },
    });

    const ledger = readRecognitionLedger(existing?.source_reference ?? null);
    if (!ledger.payments.some((payment) => payment.id === paymentId)) {
      ledger.payments.push({ id: paymentId, paidAt: paidAt.toISOString() });
    }

    const entitlement = await transaction.oremea_entitlements.upsert({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: RECOGNITION_PRODUCT_KEY,
        },
      },
      create: {
        user_id: userId,
        product_key: RECOGNITION_PRODUCT_KEY,
        status: "active",
        source: "whop",
        source_reference: JSON.stringify(ledger),
        granted_at: paidAt,
      },
      update: {
        status: "active",
        source: "whop",
        source_reference: JSON.stringify(ledger),
        granted_at: paidAt,
        revoked_at: null,
      },
    });

    return {
      entitlement,
      availableProcesses: availablePayments(ledger).length,
    };
  });
}

export async function withRecognitionCredit<T>(
  email: string,
  createSession: (transaction: Prisma.TransactionClient, paymentId: string) => Promise<T>,
) {
  const normalizedEmail = normalizeRecognitionEmail(email);

  return prisma.$transaction(async (transaction) => {
    const userId = accessUserId(normalizedEmail);
    const lockKey = `recognition-credit:${normalizedEmail}`;
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const entitlement = await transaction.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: RECOGNITION_PRODUCT_KEY,
        },
      },
    });

    const ledger = readRecognitionLedger(entitlement?.source_reference ?? null);
    const payment = availablePayments(ledger)[0];
    if (!entitlement || !payment) throw new RecognitionCreditUnavailableError();

    const result = await createSession(transaction, payment.id);
    const sessionId =
      result && typeof result === "object" && "id" in result
        ? String((result as { id: unknown }).id)
        : payment.id;

    ledger.consumed.push({
      paymentId: payment.id,
      sessionId,
      consumedAt: new Date().toISOString(),
    });

    await transaction.oremea_entitlements.update({
      where: { id: entitlement.id },
      data: {
        source_reference: JSON.stringify(ledger),
        updated_at: new Date(),
      },
    });

    return { result, paymentId: payment.id };
  });
}
