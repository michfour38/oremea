import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Script from "next/script";
import { notFound, redirect } from "next/navigation";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { INITIAL_QUANTITIES, VISIT_PRICES, visitCheckoutEnabled, visitsEnabled } from "@/src/lib/resonance/visit-offers";
import { getVisitOrder } from "@/src/lib/resonance/visit-orders";
import { whopVisitConfig } from "@/src/lib/whop/visit-payments";
import { FunnelFrame } from "./funnel-frame";
import { VisitSubmitButton } from "./submit-button";
import { purchaseVisits } from "./actions";

export const dynamic = "force-dynamic";

const VISIT_DESCRIPTIONS: Record<number, string> = {
  1: "Start with one seven-day room. A simple way to experience Resonance.",
  3: "Three visits let you explore a few different rooms without deciding everything now.",
  4: "Four visits give you the best starting rate of these three options.",
};

export default async function VisitPurchasePage({ searchParams }: {
  searchParams: Promise<{ order?: string; error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fresonance%2Fvisits");
  if (!visitsEnabled()) notFound();
  const query = await searchParams;
  const order = query.order ? await getVisitOrder(userId, query.order) : null;
  if (query.order && (!order || order.kind !== "initial")) notFound();
  if (order?.status === "paid") redirect(`/resonance/complete?order=${order.id}`);
  const checkoutEnabled = visitCheckoutEnabled();

  return (
    <FunnelFrame>
      <p className="text-sm uppercase tracking-[0.2em] text-[#c8a96a]">Resonance visits</p>
      <h1 className="mt-3 text-4xl font-light">Choose the visits. Choose the room next.</h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300">Each visit opens one seven-day room experience, starting when it is entered. Use different rooms or return to the same room for a fresh round. One visit is active at a time.</p>
      {!checkoutEnabled ? <p role="status" className="mt-6 text-zinc-300">New Resonance purchases are temporarily unavailable. Existing visits are still available.</p> : null}
      {query.error ? <p role="alert" className="mt-6 text-amber-100">{query.error === "email" ? "Verify the primary email on this account before purchasing." : "We couldn’t open checkout. You have not been charged."}</p> : null}

      {!order ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {INITIAL_QUANTITIES.map((quantity) => (
            <form key={quantity} action={purchaseVisits} className="rounded-3xl border border-white/15 bg-black/45 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-light">{quantity} visit{quantity === 1 ? "" : "s"}</h2>
                {quantity === 4 ? (
                  <span className="rounded-full border border-[#c8a96a]/45 bg-[#c8a96a]/10 px-3 py-1 text-sm uppercase tracking-[0.14em] text-[#e0c38b]">
                    Best choice
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-3xl text-[#e0c38b]">{formatOremeaPrice(VISIT_PRICES[quantity])}</p>
              <p className="mt-2 text-lg leading-7 text-zinc-300">{quantity === 3 ? "About " : ""}{formatOremeaPrice(VISIT_PRICES[quantity] / quantity)} per visit</p>
              <p className="mb-6 mt-4 text-lg leading-8 text-zinc-300">{VISIT_DESCRIPTIONS[quantity]}</p>
              <input type="hidden" name="quantity" value={quantity} />
              <input type="hidden" name="requestId" value={randomUUID()} />
              <VisitSubmitButton disabled={!checkoutEnabled}>Choose {quantity}</VisitSubmitButton>
            </form>
          ))}
        </div>
        <p className="mt-5 text-center text-lg leading-7 text-zinc-300">USD · one-time · no automatic renewal</p>
      ) : order.whop_checkout_id && order.status === "pending" && checkoutEnabled ? (
        <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-white/15 bg-black/50 p-6">
          <h2 className="text-2xl">{order.quantity} visits · {formatOremeaPrice(order.amount_cents)}</h2>
          <p className="mt-4 text-base leading-7 text-zinc-300">Checking out as {order.buyer_email}. Checkout is handled securely by Whop. Nothing beyond this purchase is charged unless you explicitly choose an additional offer afterward.</p>
          <p className="mt-3 text-lg leading-7 text-zinc-300">USD pricing. Review any applicable taxes and fees in checkout.</p>
          <Script src="https://js.whop.com/static/checkout/loader.js" strategy="afterInteractive" />
          <div key={order.id} className="mt-6 min-h-[420px]" data-whop-checkout-plan-id={order.whop_plan_id}
            data-whop-checkout-session={order.whop_checkout_id} data-whop-checkout-theme="dark"
            data-whop-checkout-prefill-email={order.buyer_email} data-whop-checkout-disable-email="true"
            data-whop-checkout-setup-future-usage="off_session"
            data-whop-checkout-return-url={`${whopVisitConfig().origin}/resonance/complete?order=${order.id}`} />
        </section>
      ) : (
        <p role="status" className="mt-8 text-base leading-8 text-zinc-300">We couldn’t confirm this checkout. If Whop showed a successful payment, contact support before trying again.</p>
      )}
      <p className="mt-8"><Link href="/entry" className="text-base text-zinc-300 underline underline-offset-4">View my rooms and purchased visits</Link></p>
    </FunnelFrame>
  );
}
