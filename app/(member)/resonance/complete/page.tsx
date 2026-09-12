import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { additionalOffers, VISIT_PRICES, visitCheckoutEnabled, visitsEnabled } from "@/src/lib/resonance/visit-offers";
import { getVisitOrder } from "@/src/lib/resonance/visit-orders";
import { FunnelFrame } from "../visits/funnel-frame";
import { AdditionalOfferPicker } from "./additional-offer-picker";

export const dynamic = "force-dynamic";

export default async function VisitCompletionPage({ searchParams }: {
  searchParams: Promise<{ order?: string; error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!visitsEnabled()) notFound();

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
        <h1 className="text-4xl font-light">{heading}</h1>
        <p className="mt-5 text-base leading-8 text-zinc-300">
          {order.status === "paid"
            ? "Choose a room below. Unused visits remain on this account."
            : "We’re still confirming this payment. Please don’t try again yet."}
          {order.parent_id ? " Your original visits are unaffected." : ""}
        </p>
        <div className="mt-8 flex flex-wrap gap-6">
          {order.status === "pending" || order.status === "unknown" ? (
            <a href={`/resonance/complete?order=${order.id}`} className="text-base text-[#e0c38b] underline">
              Check payment status
            </a>
          ) : null}
          <Link href="/entry" className="text-base text-[#e0c38b] underline">Choose my room</Link>
        </div>
      </FunnelFrame>
    );
  }

  const [complete, ...smaller] = additionalOffers(order.quantity);
  const canCharge = visitCheckoutEnabled() && Boolean(order.whop_member_id && order.whop_payment_method_id);
  return (
    <FunnelFrame>
      <p className="text-sm uppercase tracking-[0.2em] text-[#c8a96a]">
        {order.quantity === 1 ? "Your visit is purchased" : `Your ${order.quantity} visits are purchased`}
      </p>
      <h1 className="mt-3 text-4xl font-light">Complete ten?</h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300">
        Continue with the visits you already bought, or add more now.
        You do not need to add anything before choosing a room.
      </p>

      {query.error ? (
        <p role="alert" className="mt-4 text-amber-100">
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

      <p className="mt-5 text-lg leading-8 text-zinc-300">
        {canCharge
          ? "If you add visits, it is a separate purchase. Your bank may ask you to verify it."
          : "Additional visits aren’t available here right now. Your purchased visits are ready to use."}
      </p>
    </FunnelFrame>
  );
}
