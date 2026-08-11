import { auth } from "@clerk/nextjs/server";
import { WorksProviderPlan } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { cancelPayfastSubscription } from "@/lib/works/billing/payfast";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ownedProvider(providerId: string, userId: string) {
  return prisma.works_provider_memberships.findFirst({
    where: {
      provider_id: providerId,
      clerk_user_id: userId,
      active: true,
    },
    select: { id: true },
  });
}

export async function GET(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view WORKS billing." }, { status: 401 });
  }

  const providerId = new URL(request.url).searchParams.get("providerId")?.trim() || "";
  if (!providerId) {
    return NextResponse.json({ error: "Choose a provider profile." }, { status: 400 });
  }

  if (!(await ownedProvider(providerId, userId))) {
    return NextResponse.json({ error: "This provider profile is not available to this account." }, { status: 403 });
  }

  const subscription = await prisma.works_provider_payfast_subscriptions.findFirst({
    where: { provider_id: providerId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      plan: true,
      status: true,
      amount_cents: true,
      currency: true,
      started_at: true,
      cancelled_at: true,
      last_payment_at: true,
      created_at: true,
    },
  });

  return NextResponse.json({ subscription });
}

export async function DELETE(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to cancel WORKS billing." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { providerId?: unknown } | null;
  const providerId = typeof body?.providerId === "string" ? body.providerId.trim() : "";
  if (!providerId) {
    return NextResponse.json({ error: "Choose a provider profile." }, { status: 400 });
  }

  if (!(await ownedProvider(providerId, userId))) {
    return NextResponse.json({ error: "This provider profile is not available to this account." }, { status: 403 });
  }

  const subscription = await prisma.works_provider_payfast_subscriptions.findFirst({
    where: { provider_id: providerId, status: "ACTIVE" },
    orderBy: { created_at: "desc" },
  });
  if (!subscription) {
    return NextResponse.json({ error: "There is no active WORKS subscription to cancel." }, { status: 404 });
  }
  if (!subscription.subscription_token) {
    return NextResponse.json(
      { error: "PayFast has not supplied the subscription token yet. Try again after the payment notification completes." },
      { status: 409 },
    );
  }

  try {
    const cancelled = await cancelPayfastSubscription(subscription.subscription_token);
    if (!cancelled) {
      return NextResponse.json(
        { error: "PayFast did not confirm cancellation. Your WORKS plan has not been changed." },
        { status: 502 },
      );
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.works_provider_payfast_subscriptions.update({
        where: { id: subscription.id },
        data: { status: "CANCELLED", cancelled_at: now },
      }),
      prisma.works_provider_commercial_profiles.updateMany({
        where: { provider_id: providerId, plan: subscription.plan },
        data: { plan: WorksProviderPlan.FREE, plan_ends_at: now },
      }),
    ]);

    return NextResponse.json({ cancelled: true });
  } catch (error) {
    console.error("WORKS PayFast subscription cancellation failed:", error);
    return NextResponse.json(
      { error: "WORKS could not cancel the PayFast subscription yet." },
      { status: 502 },
    );
  }
}
