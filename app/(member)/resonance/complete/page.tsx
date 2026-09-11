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
            : "Only confirmed payments add visits. Do not submit another charge while this is being checked."}
          {order.parent_id ? " The original purchase remains available, regardless of this additional payment." : ""}
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
  const unlockedPartyTicket = await prisma.oremea_party_registrations.findFirst({
    where: {
      event_key: "what-keeps-repeating-in-connection-1",
      email: order.buyer_email.toLowerCase(),
      invited_by: { not: null },
      invite_allowance: { gt: 0 },
    },
    select: { id: true },
  });

  return (
    <FunnelFrame>
      <p className="text-sm uppercase tracking-[0.2em] text-[#c8a96a]">
        {order.quantity === 1 ? "Your visit is purchased" : `Your ${order.quantity} visits are purchased`}
      </p>
      <h1 className="mt-3 text-4xl font-light">Complete ten?</h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300">
        Your first purchase is secure. This page is only about whether you want to add more visits now.
        No extra purchase is required before choosing a room.
      </p>

      {query.error ? (
        <p role="alert" className="mt-4 text-amber-100">
          The additional purchase could not be started. Your original visits remain available.
        </p>
      ) : null}

      {unlockedPartyTicket ? (
        <div className="mt-6 rounded-3xl border border-[#c8a96a]/35 bg-[#c8a96a]/[0.06] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#c8a96a]">
            Party invitations unlocked
          </p>
          <h2 className="mt-2 text-2xl text-zinc-100">Two guest invitations are now available.</h2>
          <p className="mt-3 text-lg leading-8 text-zinc-300">
            The guest ticket that brought you here did not reproduce automatically. This purchase unlocks two invitations of your own.
          </p>
          <Link
            href={`/party?registered=${unlockedPartyTicket.id}`}
            className="mt-5 inline-flex rounded-full border border-[#c8a96a]/55 px-6 py-3 text-lg text-[#f1dfb4]"
          >
            Open my two invitations
          </Link>
        </div>
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
          ? "Any accepted addition is a separate charge using the saved payment method. A bank may still require verification."
          : "A saved-payment addition is not available for this checkout. Your purchased visits can be used now."}
      </p>
    </FunnelFrame>
  );
}
