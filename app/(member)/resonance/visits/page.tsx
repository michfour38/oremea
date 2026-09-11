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
      {!checkoutEnabled ? <p role="status" className="mt-6 text-zinc-300">Package checkout is not open yet. Existing purchases remain available.</p> : null}
      {query.error ? <p role="alert" className="mt-6 text-amber-100">{query.error === "email" ? "Verify the primary email on this account before purchasing." : "Checkout could not be opened. No payment has been confirmed."}</p> : null}

      {!order ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {INITIAL_QUANTITIES.map((quantity) => (
            <form key={quantity} action={purchaseVisits} className="rounded-3xl border border-white/15 bg-black/45 p-6">
              <h2 className="text-2xl font-light">{quantity} visit{quantity === 1 ? "" : "s"}</h2>
              <p className="mt-4 text-3xl text-[#e0c38b]">{formatOremeaPrice(VISIT_PRICES[quantity])}</p>
              <p className="mb-6 mt-2 text-sm text-zinc-400">{quantity === 3 ? "About " : ""}{formatOremeaPrice(VISIT_PRICES[quantity] / quantity)} per visit</p>
              <input type="hidden" name="quantity" value={quantity} />
              <input type="hidden" name="requestId" value={randomUUID()} />
              <VisitSubmitButton disabled={!checkoutEnabled}>Choose {quantity}</VisitSubmitButton>
            </form>
          ))}
        </div>
      ) : order.whop_checkout_id && order.status === "pending" && checkoutEnabled ? (
        <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-white/15 bg-black/50 p-6">
          <h2 className="text-2xl">{order.quantity} visits · {formatOremeaPrice(order.amount_cents)}</h2>
          <p className="mt-4 text-base leading-7 text-zinc-300">Checking out as {order.buyer_email}. Whop securely saves an eligible payment method for an optional separate purchase on the next page. Nothing extra is charged unless an offer is accepted.</p>
          <p className="mt-3 text-sm text-zinc-400">USD pricing. Review any applicable taxes and fees in checkout.</p>
          <Script src="https://js.whop.com/static/checkout/loader.js" strategy="afterInteractive" />
          <div key={order.id} className="mt-6 min-h-[420px]" data-whop-checkout-plan-id={order.whop_plan_id}
            data-whop-checkout-session={order.whop_checkout_id} data-whop-checkout-theme="dark"
            data-whop-checkout-prefill-email={order.buyer_email} data-whop-checkout-disable-email="true"
            data-whop-checkout-setup-future-usage="off_session"
            data-whop-checkout-return-url={`${whopVisitConfig().origin}/resonance/complete?order=${order.id}`} />
        </section>
      ) : (
        <p role="status" className="mt-8 text-base leading-8 text-zinc-300">This checkout could not be confirmed. No visits have been added for it. Contact support before retrying if Whop has shown a successful payment.</p>
      )}
      <p className="mt-8"><Link href="/entry" className="text-base text-zinc-300 underline underline-offset-4">View my rooms and purchased visits</Link></p>
    </FunnelFrame>
  );
}
