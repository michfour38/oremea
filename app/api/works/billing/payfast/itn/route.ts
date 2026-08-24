import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getPayfastConfig,
  parsePayfastItn,
  payfastAmountToCents,
  payfastEventKey,
  verifyPayfastItnSignature,
  verifyPayfastServerConfirmation,
  verifyPayfastSource,
} from "@/lib/works/billing/payfast";
import { worksPaidThroughEnd } from "@/lib/works/billing/period";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const { data, parameterString } = parsePayfastItn(rawBody);

  let config: ReturnType<typeof getPayfastConfig>;
  try {
    config = getPayfastConfig();
  } catch (error) {
    console.error("WORKS PayFast ITN configuration error:", error);
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  if (!verifyPayfastItnSignature({ data, parameterString, passphrase: config.passphrase })) {
    return NextResponse.json({ error: "Invalid PayFast signature." }, { status: 401 });
  }

  if (!(await verifyPayfastSource(request))) {
    return NextResponse.json({ error: "Invalid PayFast source." }, { status: 401 });
  }

  if (data.merchant_id?.trim() !== config.merchantId) {
    return NextResponse.json({ error: "Unexpected PayFast merchant." }, { status: 401 });
  }

  const merchantPaymentId = data.m_payment_id?.trim() || "";
  if (!merchantPaymentId) {
    return NextResponse.json({ error: "Missing merchant payment ID." }, { status: 422 });
  }

  const subscription = await prisma.works_provider_payfast_subscriptions.findUnique({
    where: { merchant_payment_id: merchantPaymentId },
  });
  if (!subscription) {
    return NextResponse.json({ error: "Unknown WORKS payment." }, { status: 404 });
  }

  const amountCents = payfastAmountToCents(data.amount_gross);
  if (amountCents == null || amountCents !== subscription.amount_cents) {
    return NextResponse.json({ error: "PayFast amount mismatch." }, { status: 422 });
  }

  if (!(await verifyPayfastServerConfirmation(parameterString))) {
    return NextResponse.json({ error: "PayFast server confirmation failed." }, { status: 401 });
  }

  const eventKey = payfastEventKey(rawBody);
  const paymentStatus = (data.payment_status || "UNKNOWN").trim().toUpperCase();
  const payfastPaymentId = data.pf_payment_id?.trim() || null;
  const subscriptionToken = data.token?.trim() || null;
  const now = new Date();

  if (paymentStatus === "COMPLETE" && !payfastPaymentId) {
    return NextResponse.json({ error: "Completed PayFast payment is missing its payment ID." }, { status: 422 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.works_provider_payfast_events.findUnique({
        where: { event_key: eventKey },
        select: { id: true },
      });
      if (duplicate) return { duplicate: true };

      await tx.works_provider_payfast_events.create({
        data: {
          subscription_id: subscription.id,
          event_key: eventKey,
          payfast_payment_id: payfastPaymentId,
          payment_status: paymentStatus,
          amount_cents: amountCents,
        },
      });

      if (paymentStatus === "COMPLETE") {
        const startedAt = subscription.started_at ?? now;
        await tx.works_provider_payfast_subscriptions.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            subscription_token: subscriptionToken ?? subscription.subscription_token,
            started_at: startedAt,
            cancelled_at: null,
            last_payment_at: now,
          },
        });

        await tx.works_provider_commercial_profiles.upsert({
          where: { provider_id: subscription.provider_id },
          create: {
            provider_id: subscription.provider_id,
            plan: subscription.plan,
            plan_started_at: startedAt,
            plan_ends_at: null,
          },
          update: {
            plan: subscription.plan,
            plan_started_at: startedAt,
            plan_ends_at: null,
          },
        });
      } else if (paymentStatus === "CANCELLED") {
        const accessEndsAt = worksPaidThroughEnd({
          lastPaymentAt: subscription.last_payment_at,
          startedAt: subscription.started_at,
          now,
        });

        await tx.works_provider_payfast_subscriptions.update({
          where: { id: subscription.id },
          data: {
            status: "CANCELLED",
            subscription_token: subscriptionToken ?? subscription.subscription_token,
            cancelled_at: now,
          },
        });

        await tx.works_provider_commercial_profiles.updateMany({
          where: {
            provider_id: subscription.provider_id,
            plan: subscription.plan,
          },
          data: { plan_ends_at: accessEndsAt },
        });
      }

      return { duplicate: false };
    });

    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    console.error("WORKS PayFast ITN processing failed:", error);
    return NextResponse.json(
      { error: "WORKS could not record this PayFast notification." },
      { status: 500 },
    );
  }
}
