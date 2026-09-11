import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { additionalOffers, VISIT_PRICES, visitCheckoutEnabled, visitsEnabled } from "@/src/lib/resonance/visit-offers";
import { getVisitOrder } from "@/src/lib/resonance/visit-orders";
import { FunnelFrame } from "../visits/funnel-frame";
import { VisitSubmitButton } from "../visits/submit-button";
import { addVisits, skipAddition } from "../visits/actions";

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
    ? await prisma.resonance_visit_orders.findUnique({ where: { parent_id: order.id } }) : null;
  if (child) redirect(`/resonance/complete?order=${child.id}`);

  if (order.status !== "paid" || order.kind !== "initial" || order.offer_closed_at) {
    const heading = order.status === "paid" ? "Your visits are ready."
      : order.status === "failed" ? "The payment did not complete."
        : order.status === "refunded" ? "This payment is under review."
          : "The payment is not confirmed yet.";
    return (
      <FunnelFrame>
        <h1 className="text-4xl font-light">{heading}</h1>
        <p className="mt-5 text-base leading-8 text-zinc-300">{order.status === "paid"
          ? "Choose a room below. Unused visits remain on this account."
          : "Only confirmed payments add visits. Do not submit another charge while this is being checked."}
          {order.parent_id ? " The original purchase remains available, regardless of this additional payment." : ""}</p>
        <div className="mt-8 flex flex-wrap gap-6">
          {order.status === "pending" || order.status === "unknown" ? <a href={`/resonance/complete?order=${order.id}`} className="text-base text-[#e0c38b] underline">Check payment status</a> : null}
          <Link href="/entry" className="text-base text-[#e0c38b] underline">Choose my room</Link>
        </div>
      </FunnelFrame>
    );
  }

  const [complete, ...smaller] = additionalOffers(order.quantity);
  const canCharge = visitCheckoutEnabled() && Boolean(order.whop_member_id && order.whop_payment_method_id);
  return (
    <FunnelFrame>
      <p className="text-sm uppercase tracking-[0.2em] text-[#c8a96a]">{order.quantity === 1 ? "Your visit is purchased" : `Your ${order.quantity} visits are purchased`}</p>
      <h1 className="mt-3 text-4xl font-light">Make it ten visits?</h1>
      <p className="mt-5 text-base leading-8 text-zinc-300">One optional, separate purchase. Choose any rooms, including a fresh round in a room already visited.</p>
      {query.error ? <p role="alert" className="mt-4 text-amber-100">The additional purchase could not be started. The original visits remain available.</p> : null}
      <form action={addVisits} className="mt-8 rounded-3xl border border-[#c8a96a]/50 bg-black/50 p-7">
        <h2 className="text-2xl">Add {complete.quantity} visits · {formatOremeaPrice(complete.amountCents)}</h2>
        <p className="mb-6 mt-3 text-base text-zinc-300">Ten visits altogether for {formatOremeaPrice(VISIT_PRICES[10])}, before any applicable taxes or fees.</p>
        <input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="quantity" value={complete.quantity} />
        <VisitSubmitButton disabled={!canCharge}>Pay {formatOremeaPrice(complete.amountCents)} with saved payment</VisitSubmitButton>
      </form>
      <details className="mt-5 rounded-3xl border border-white/15 bg-black/40 p-6">
        <summary className="cursor-pointer text-base text-zinc-100">Choose fewer — compare smaller additions</summary>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {smaller.map((offer) => (
            <form key={offer.quantity} action={addVisits}>
              <input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="quantity" value={offer.quantity} />
              <VisitSubmitButton disabled={!canCharge}>Add {offer.quantity} · Pay {formatOremeaPrice(offer.amountCents)}</VisitSubmitButton>
            </form>
          ))}
        </div>
      </details>
      <p className="mt-5 text-sm leading-7 text-zinc-400">{canCharge ? "Accepting either offer requests a separate charge using the saved payment method. A bank may require additional verification." : "A saved-payment addition is not available for this checkout. The purchased visits can be used now."}</p>
      <form action={skipAddition} className="mt-6">
        <input type="hidden" name="orderId" value={order.id} />
        <VisitSubmitButton>No thanks — choose my room</VisitSubmitButton>
      </form>
    </FunnelFrame>
  );
}
