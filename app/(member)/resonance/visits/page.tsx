import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import Script from "next/script";
import { notFound, redirect } from "next/navigation";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { INITIAL_QUANTITIES, VISIT_PRICES } from "@/src/lib/resonance/visit-offers";
import { visitCheckoutAvailableFor, visitCreditsAvailableFor } from "@/src/lib/resonance/visit-access";
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
  if (!(await visitCreditsAvailableFor(userId))) notFound();
  const query = await searchParams;
  const order = query.order ? await getVisitOrder(userId, query.order) : null;
  if (query.order && (!order || order.kind !== "initial")) notFound();
  if (order?.status === "paid") redirect(`/resonance/complete?order=${order.id}`);
  const checkoutEnabled = await visitCheckoutAvailableFor(userId);
  // A declined initial payment can be retried inside the same provider checkout.
  // Unknown outcomes stay blocked to avoid submitting a second uncertain charge.
  const canResumeCheckout = order?.status === "pending" || order?.status === "failed";
  const checkoutOrigin =
    order?.whop_checkout_id && canResumeCheckout && checkoutEnabled
      ? (await whopVisitConfig()).origin
      : null;

  return (
    <FunnelFrame>
      <div className={order ? "mx-auto max-w-xl" : undefined}>
        <p className="res-accent text-sm uppercase tracking-[0.2em]">Resonance visits</p>
        <h1 className="res-text mt-3 text-4xl font-light">Choose the visits. Choose the room next.</h1>
        <p className="res-text-primary mt-5 text-base leading-8">Each visit opens one seven-day room experience, starting when it is entered. Use different rooms or return to the same room for a fresh round. One visit is active at a time.</p>
        {!checkoutEnabled ? <p role="status" className="res-text-primary mt-6">Package checkout is not open yet. Existing purchases remain available.</p> : null}
        {query.error ? <p role="alert" className="res-alert mt-6">{query.error === "email" ? "Verify the primary email on this account before purchasing." : "Checkout could not be opened. No payment has been confirmed."}</p> : null}
      </div>

      {!order ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {INITIAL_QUANTITIES.map((quantity) => (
            <form key={quantity} action={purchaseVisits} className="res-border res-panel rounded-3xl border p-6">
              <h2 className="res-text text-2xl font-light">{quantity} visit{quantity === 1 ? "" : "s"}</h2>
              <p className="res-accent mt-4 text-3xl">{formatOremeaPrice(VISIT_PRICES[quantity])}</p>
              <p className="res-text-secondary mb-6 mt-2 text-sm">{quantity === 3 ? "About " : ""}{formatOremeaPrice(VISIT_PRICES[quantity] / quantity)} per visit</p>
              <input type="hidden" name="quantity" value={quantity} />
              <input type="hidden" name="requestId" value={randomUUID()} />
              <VisitSubmitButton disabled={!checkoutEnabled}>Choose {quantity}</VisitSubmitButton>
            </form>
          ))}
        </div>
      ) : order.whop_checkout_id && canResumeCheckout && checkoutEnabled ? (
        <section className="res-border res-panel mx-auto mt-8 max-w-xl rounded-3xl border p-6">
          <h2 className="res-text text-2xl">{order.quantity} visits · {formatOremeaPrice(order.amount_cents)}</h2>
          <Script src="https://js.whop.com/static/checkout/loader.js" strategy="afterInteractive" />
          <div key={order.id} className="mt-6 min-h-[420px]" data-whop-checkout-plan-id={order.whop_plan_id}
            data-whop-checkout-session={order.whop_checkout_id} data-whop-checkout-theme="dark"
            data-whop-checkout-prefill-email={order.buyer_email} data-whop-checkout-disable-email="true"
            data-whop-checkout-setup-future-usage="off_session"
            data-whop-checkout-return-url={`${checkoutOrigin}/resonance/complete?order=${order.id}`} />
        </section>
      ) : (
        <p role="status" className="res-text-primary mx-auto mt-8 max-w-xl text-base leading-8">This checkout could not be confirmed. No visits have been added for it. Contact support before retrying if Whop has shown a successful payment.</p>
      )}
    </FunnelFrame>
  );
}
