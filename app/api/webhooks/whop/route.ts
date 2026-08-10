import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { grantCompassAccess } from "@/src/lib/compass/compass-access";
import { grantRecognitionCredit } from "@/src/lib/recognition/recognition-access";
import { setRecognitionMembershipAccess } from "@/src/lib/recognition/recognition-conversation-access";
import { getResonanceWeekForWhopProduct } from "@/src/lib/resonance/resonance-commerce";
import { createPurchasedResonanceRun } from "@/src/lib/resonance/resonance-week-run";
import { verifyWhopWebhook } from "@/src/lib/whop/verify-webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WhopPaymentSucceededEvent = {
  type?: unknown;
  data?: {
    id?: unknown;
    paid_at?: unknown;
    created_at?: unknown;
    product?: {
      id?: unknown;
    } | null;
    user?: {
      email?: unknown;
    } | null;
  } | null;
};

type WhopMembershipEvent = {
  type?: unknown;
  timestamp?: unknown;
  data?: {
    id?: unknown;
    updated_at?: unknown;
    renewal_period_end?: unknown;
    product?: {
      id?: unknown;
    } | null;
    user?: {
      email?: unknown;
    } | null;
  } | null;
};

function readPayment(event: WhopPaymentSucceededEvent) {
  const payment = event.data;
  const paymentId = typeof payment?.id === "string" ? payment.id.trim() : "";
  const productId =
    typeof payment?.product?.id === "string" ? payment.product.id.trim() : "";
  const email =
    typeof payment?.user?.email === "string"
      ? payment.user.email.trim().toLowerCase()
      : "";
  const paidAtValue =
    typeof payment?.paid_at === "string"
      ? payment.paid_at
      : typeof payment?.created_at === "string"
        ? payment.created_at
        : "";
  const paidAt = new Date(paidAtValue);

  if (!paymentId || !productId || !email || Number.isNaN(paidAt.getTime())) {
    return null;
  }

  return { paymentId, productId, email, paidAt };
}

function readMembership(event: WhopMembershipEvent) {
  const membership = event.data;
  const membershipId =
    typeof membership?.id === "string" ? membership.id.trim() : "";
  const productId =
    typeof membership?.product?.id === "string"
      ? membership.product.id.trim()
      : "";
  const email =
    typeof membership?.user?.email === "string"
      ? membership.user.email.trim().toLowerCase()
      : "";
  const eventAtValue =
    typeof membership?.updated_at === "string"
      ? membership.updated_at
      : typeof event.timestamp === "string"
        ? event.timestamp
        : "";
  const eventAt = new Date(eventAtValue);
  const renewalPeriodEnd =
    typeof membership?.renewal_period_end === "string"
      ? new Date(membership.renewal_period_end)
      : null;

  if (
    !membershipId ||
    !productId ||
    !email ||
    Number.isNaN(eventAt.getTime()) ||
    (renewalPeriodEnd && Number.isNaN(renewalPeriodEnd.getTime()))
  ) {
    return null;
  }

  return {
    membershipId,
    productId,
    email,
    eventAt,
    renewalPeriodEnd,
  };
}

async function findExactlyOneOremeaUser(email: string) {
  const matchingUsers = await clerkClient.users.getUserList({
    emailAddress: [email],
    limit: 2,
  });

  return matchingUsers.data.length === 1 ? matchingUsers.data[0] : null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET?.trim() || "";
  const verified = verifyWhopWebhook({
    body,
    webhookId: request.headers.get("webhook-id"),
    webhookTimestamp: request.headers.get("webhook-timestamp"),
    webhookSignature: request.headers.get("webhook-signature"),
    secret: webhookSecret,
  });

  if (!verified) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 },
    );
  }

  let event: WhopPaymentSucceededEvent & WhopMembershipEvent;
  try {
    event = JSON.parse(body) as WhopPaymentSucceededEvent & WhopMembershipEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook body." }, { status: 400 });
  }

  if (
    event.type === "membership.activated" ||
    event.type === "membership.deactivated"
  ) {
    const membership = readMembership(event);
    if (!membership) {
      return NextResponse.json(
        { error: "Membership is missing its ID, product, email, or event time." },
        { status: 422 },
      );
    }

    const recognitionMembershipProductId =
      process.env.WHOP_RECOGNITION_SUBSCRIPTION_PRODUCT_ID?.trim();
    if (
      !recognitionMembershipProductId ||
      membership.productId !== recognitionMembershipProductId
    ) {
      return NextResponse.json({ received: true, fulfilled: false });
    }

    const entitlement = await setRecognitionMembershipAccess({
      email: membership.email,
      membershipId: membership.membershipId,
      active: event.type === "membership.activated",
      eventAt: membership.eventAt,
      renewalPeriodEnd: membership.renewalPeriodEnd,
    });

    return NextResponse.json({
      received: true,
      fulfilled: true,
      product: "recognition",
      access: "membership",
      active: entitlement?.status === "active",
      expiresAt: entitlement?.expires_at?.toISOString() ?? null,
    });
  }

  if (event.type !== "payment.succeeded") {
    return NextResponse.json({ received: true, fulfilled: false });
  }

  const payment = readPayment(event);
  if (!payment) {
    return NextResponse.json(
      { error: "Payment is missing its ID, product, email, or payment time." },
      { status: 422 },
    );
  }

  const recognitionProductId = process.env.WHOP_RECOGNITION_PRODUCT_ID?.trim();
  if (recognitionProductId && payment.productId === recognitionProductId) {
    const credit = await grantRecognitionCredit({
      email: payment.email,
      paymentId: payment.paymentId,
      paidAt: payment.paidAt,
    });

    return NextResponse.json({
      received: true,
      fulfilled: true,
      product: "recognition",
      access: "founding",
      availableProcesses: credit.availableProcesses,
    });
  }

  const resonanceWeek = getResonanceWeekForWhopProduct(payment.productId);
  if (resonanceWeek) {
    const user = await findExactlyOneOremeaUser(payment.email);
    if (!user) {
      console.error(
        `Resonance payment ${payment.paymentId} could not be matched to one Oremea account for ${payment.email}.`,
      );
      return NextResponse.json(
        { error: "Resonance buyer account could not be matched." },
        { status: 422 },
      );
    }

    const run = await createPurchasedResonanceRun({
      userId: user.id,
      weekNumber: resonanceWeek,
      purchaseSource: "whop",
      purchaseReference: payment.paymentId,
      purchasedAt: payment.paidAt,
    });

    return NextResponse.json({
      received: true,
      fulfilled: true,
      product: "resonance",
      weekNumber: run.weekNumber,
      runNumber: run.runNumber,
      runId: run.id,
    });
  }

  const compassProductId = process.env.WHOP_COMPASS_PRODUCT_ID?.trim();
  if (compassProductId && payment.productId === compassProductId) {
    const user = await findExactlyOneOremeaUser(payment.email);
    if (!user) {
      console.error(
        `Compass payment ${payment.paymentId} could not be matched to one Oremea account for ${payment.email}.`,
      );
      return NextResponse.json(
        { error: "Compass buyer account could not be matched." },
        { status: 422 },
      );
    }

    const entitlement = await grantCompassAccess({
      userId: user.id,
      paymentId: payment.paymentId,
      paidAt: payment.paidAt,
    });

    return NextResponse.json({
      received: true,
      fulfilled: true,
      product: "compass",
      expiresAt: entitlement.expires_at?.toISOString() ?? null,
    });
  }

  return NextResponse.json({ received: true, fulfilled: false });
}
