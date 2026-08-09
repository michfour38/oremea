import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { grantCompassAccess } from "@/src/lib/compass/compass-access";
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

  let event: WhopPaymentSucceededEvent;

  try {
    event = JSON.parse(body) as WhopPaymentSucceededEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook body." }, { status: 400 });
  }

  if (event.type !== "payment.succeeded") {
    return NextResponse.json({ received: true, fulfilled: false });
  }

  const compassProductId = process.env.WHOP_COMPASS_PRODUCT_ID?.trim();

  if (!compassProductId) {
    console.error("WHOP_COMPASS_PRODUCT_ID is not configured.");
    return NextResponse.json(
      { error: "Compass fulfillment is not configured." },
      { status: 503 },
    );
  }

  const payment = event.data;
  const productId =
    typeof payment?.product?.id === "string" ? payment.product.id : "";

  if (productId !== compassProductId) {
    return NextResponse.json({ received: true, fulfilled: false });
  }

  const paymentId = typeof payment?.id === "string" ? payment.id.trim() : "";
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

  if (!paymentId || !email || Number.isNaN(paidAt.getTime())) {
    return NextResponse.json(
      { error: "Compass payment is missing its ID, email, or payment time." },
      { status: 422 },
    );
  }

  const matchingUsers = await clerkClient.users.getUserList({
    emailAddress: [email],
    limit: 2,
  });

  if (matchingUsers.data.length !== 1) {
    console.error(
      `Compass payment ${paymentId} could not be matched to one Oremea account for ${email}.`,
    );
    return NextResponse.json(
      { error: "Compass buyer account could not be matched." },
      { status: 422 },
    );
  }

  const entitlement = await grantCompassAccess({
    userId: matchingUsers.data[0].id,
    paymentId,
    paidAt,
  });

  return NextResponse.json({
    received: true,
    fulfilled: true,
    expiresAt: entitlement.expires_at?.toISOString() ?? null,
  });
}
