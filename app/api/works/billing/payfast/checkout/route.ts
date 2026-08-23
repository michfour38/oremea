import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { WorksProviderPlan } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { buildWorksPayfastCheckout } from "@/lib/works/billing/payfast";
import { resolveWorksProviderPlan } from "@/lib/works/providers/public-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAID_PLANS = new Set(["VERIFIED", "GROWTH"]);
const RECURRING_CONSENT_VERSION = "works-payfast-recurring-v1-2026-08-23";

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to choose a WORKS provider plan." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        providerId?: unknown;
        plan?: unknown;
        acceptRecurringTerms?: unknown;
      }
    | null;
  const providerId =
    typeof body?.providerId === "string" ? body.providerId.trim() : "";
  const planKey = typeof body?.plan === "string" ? body.plan.trim() : "";

  if (!providerId || !PAID_PLANS.has(planKey)) {
    return NextResponse.json(
      { error: "Choose a WORKS provider and paid plan." },
      { status: 400 },
    );
  }

  if (body?.acceptRecurringTerms !== true) {
    return NextResponse.json(
      {
        error:
          "Confirm the recurring charge, cancellation and refund terms before opening PayFast.",
      },
      { status: 400 },
    );
  }

  const membership = await prisma.works_provider_memberships.findFirst({
    where: {
      provider_id: providerId,
      clerk_user_id: userId,
      active: true,
    },
    select: { id: true },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "This provider profile is not available to this account." },
      { status: 403 },
    );
  }

  const existingActive =
    await prisma.works_provider_payfast_subscriptions.findFirst({
      where: { provider_id: providerId, status: "ACTIVE" },
      orderBy: { created_at: "desc" },
      select: { plan: true },
    });
  if (existingActive) {
    const samePlan = existingActive.plan === planKey;
    return NextResponse.json(
      {
        error: samePlan
          ? "This WORKS plan is already active."
          : "Cancel the current WORKS plan before switching plans.",
      },
      { status: 409 },
    );
  }

  const plan = resolveWorksProviderPlan(planKey);
  if (plan.key === "FREE" || plan.priceMonthlyZar <= 0) {
    return NextResponse.json(
      { error: "This WORKS plan does not require PayFast billing." },
      { status: 400 },
    );
  }

  const merchantPaymentId = `works-${randomUUID()}`;
  const amountCents = plan.priceMonthlyZar * 100;
  const amountLabel = `R${plan.priceMonthlyZar.toLocaleString("en-ZA")}.00 ZAR`;
  const recurringConsentSummary = [
    `${plan.name} plan: ${amountLabel} is charged for the initial successful PayFast payment.`,
    `The same ${amountLabel} recurring charge is then scheduled monthly, on or around the same calendar day as the initial successful payment, until cancelled.`,
    "Cancellation from WORKS Billing cancels the PayFast subscription and returns the business to the Free plan, stopping future renewals.",
    "Charges already validly incurred, billing errors, failed supply and mandatory consumer rights are handled under Oremea's Payments, Subscriptions, Cancellation & Refund Policy.",
  ].join(" ");

  try {
    const checkout = buildWorksPayfastCheckout({
      merchantPaymentId,
      planName: plan.name,
      amountCents,
    });

    await prisma.works_provider_payfast_subscriptions.create({
      data: {
        provider_id: providerId,
        plan: plan.key as WorksProviderPlan,
        merchant_payment_id: merchantPaymentId,
        status: "PENDING",
        amount_cents: amountCents,
        currency: "ZAR",
        recurring_consent_at: new Date(),
        recurring_consent_version: RECURRING_CONSENT_VERSION,
        recurring_consent_summary: recurringConsentSummary,
        recurring_consent_user_id: userId,
      },
    });

    return NextResponse.json(checkout);
  } catch (error) {
    console.error("WORKS PayFast checkout creation failed:", error);
    return NextResponse.json(
      { error: "WORKS billing is not ready to open PayFast yet." },
      { status: 503 },
    );
  }
}
