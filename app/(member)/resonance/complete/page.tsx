import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { additionalOffers, VISIT_PRICES } from "@/src/lib/resonance/visit-offers";
import { visitCheckoutAvailableFor, visitCreditsAvailableFor } from "@/src/lib/resonance/visit-access";
import { getVisitOrder } from "@/src/lib/resonance/visit-orders";
import { FunnelFrame } from "../visits/funnel-frame";
import { AdditionalOfferPicker } from "./additional-offer-picker";

export const dynamic = "force-dynamic";

export default async function VisitCompletionPage({ searchParams }: {
  searchParams: Promise<{ order?: string; error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCreditsAvailableFor(userId))) notFound();

  const query = await searchParams;
  const order = query.order ? await getVisitOrder(userId, query.order) : null;
  if (!order) notFound();

  const child = order.kind === "initial"
    ? await prisma.resonance_visit_orders.findUnique({ where: { parent_id: order.id } })
    : null;
  if (child) redirect(`/resonance/complete?order=${child.id}`);

  if (order.status !== "paid" || order.kind !== "initial" || order.offer_closed_at) {
    const heading = order.status === "paid" ? "Your visits are ready."
      : order.status === "failed" ? "The payment did not complete."
        : order.status === "refunded" ? "This payment is under review."
          : "The payment is not confirmed yet.";

    return (
      <FunnelFrame>
        <h1 className="res-text text-4xl font-light">{heading}</h1>
        <p className="res-text-primary mt-5 text-base leading-8">
          {order.status === "paid"
            ? "Choose a room below. Unused visits remain on this account."
            : "Only confirmed payments add visits. Do not submit another charge while this is being checked."}
          {order.parent_id ? " The original purchase remains available, regardless of this additional payment." : ""}
        </p>
        <div className="mt-8 flex flex-wrap gap-6">
          {order.status === "failed" && order.kind === "initial" && order.whop_checkout_id ? (
            <Link href={`/resonance/visits?order=${order.id}`} className="res-accent res-accent-hover text-base underline">
              Return to checkout
            </Link>
          ) : null}
          {order.status === "pending" || order.status === "unknown" ? (
            <a href={`/resonance/complete?order=${order.id}`} className="res-accent res-accent-hover text-base underline">
              Check payment status
            </a>
          ) : null}
          <Link href="/entry" className="res-accent res-accent-hover text-base underline">Choose my room</Link>
        </div>
      </FunnelFrame>
    );
  }

  const [complete, ...smaller] = additionalOffers(order.quantity);
  const canCharge = (await visitCheckoutAvailableFor(userId)) && Boolean(order.whop_member_id && order.whop_payment_method_id);

  return (
    <FunnelFrame>
      <p className="res-accent text-sm uppercase tracking-[0.2em]">
        {order.quantity === 1 ? "Your visit is purchased" : `Your ${order.quantity} visits are purchased`}
      </p>
      <h1 className="res-text mt-3 text-4xl font-light">Complete ten?</h1>
      <p className="res-text-primary mt-5 max-w-2xl text-base leading-8">
        Your first purchase is secure. This page is only about whether you want to add more visits now.
        No extra purchase is required before choosing a room.
      </p>

      {query.error ? (
        <p role="alert" className="res-alert mt-4">
          The additional purchase could not be started. Your original visits remain available.
        </p>
      ) : null}

      <AdditionalOfferPicker
        orderId={order.id}
        currentQuantity={order.quantity}
        currentPaidCents={order.amount_cents}
        completeQuantity={complete.quantity}
        completeAmountCents={complete.amountCents}
        completeTotalCents={VISIT_PRICES[10]}
        smallerOffers={smaller.map((offer) => ({
          quantity: offer.quantity,
          amountCents: offer.amountCents,
        }))}
        canCharge={canCharge}
      />

      <p className="res-text-secondary mt-5 text-sm leading-7">
        {canCharge
          ? "Any accepted addition is a separate charge using the saved payment method. A bank may still require verification."
          : "A saved-payment addition is not available for this checkout. Your purchased visits can be used now."}
      </p>
    </FunnelFrame>
  );
}
