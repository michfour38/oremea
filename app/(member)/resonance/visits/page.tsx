import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Script from "next/script";
import { notFound, redirect } from "next/navigation";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { INITIAL_QUANTITIES, VISIT_PRICES, visitCheckoutEnabled } from "@/src/lib/resonance/visit-offers";
import { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";
import { visitCheckoutAvailableFor, visitCreditsAvailableFor } from "@/src/lib/resonance/visit-access";
import { getUnresolvedInitialVisitOrder, getVisitBalance, getVisitOrder, reconcileInitialVisitOrder } from "@/src/lib/resonance/visit-orders";
import { restoreInitialVisitCheckout } from "@/src/lib/resonance/initial-checkout-recovery";
import { guestOwnerFromClaim, isGuestVisitOwner } from "@/src/lib/resonance/guest-visit-identity";
import { visitCheckoutReturnUrl, whopVisitConfig } from "@/src/lib/whop/visit-payments";
import { isOremeaAdmin } from "@/lib/auth/admin-access";
import { isAdminTestVisitPlan } from "@/src/lib/resonance/admin-test-commerce";
import { FunnelFrame } from "./funnel-frame";
import { VisitSubmitButton } from "./submit-button";
import { purchaseVisits } from "./actions";

export const dynamic = "force-dynamic";

export default async function VisitPurchasePage({ searchParams }: {
  searchParams: Promise<{ order?: string; error?: string; room?: string | string[]; claim?: string }>;
}) {
  const query = await searchParams;
  const roomTarget = getResonanceRoomTarget(query.room);
  const roomQuery = roomTarget ? `?room=${roomTarget.weekNumber}` : "";
  const roomSuffix = roomTarget ? `&room=${roomTarget.weekNumber}` : "";
  const guestOwner = guestOwnerFromClaim(query.claim);
  const { userId } = await auth();

  const adminMode = userId ? await isOremeaAdmin(userId) : false;
  if (userId && !(await visitCreditsAvailableFor(userId))) notFound();
  const checkoutEnabled = userId
    ? await visitCheckoutAvailableFor(userId)
    : visitCheckoutEnabled();

  if (!query.order && userId && !adminMode) {
    const unresolved = await getUnresolvedInitialVisitOrder(userId);
    if (unresolved) redirect(`/resonance/visits?order=${unresolved.id}${roomSuffix}`);
  }

  const ownerId = guestOwner ?? userId;
  let order = query.order && ownerId ? await getVisitOrder(ownerId, query.order) : null;
  if (query.order && (!order || order.kind !== "initial")) notFound();

  const isGuestOrder = Boolean(order && isGuestVisitOwner(order.user_id));
  if (adminMode && order && !isGuestOrder && !isAdminTestVisitPlan(order.whop_plan_id)) {
    redirect(`/resonance/visits${roomQuery}`);
  }

  if (checkoutEnabled && order && ownerId && !order.whop_checkout_id && ["pending", "unknown"].includes(order.status)) {
    try {
      order = await restoreInitialVisitCheckout(
        ownerId,
        order.id,
        isGuestOrder ? { claim: query.claim, room: roomTarget?.weekNumber } : undefined,
      );
    } catch {
      // The same checkout can be recovered later; no payment is submitted here.
    }
  }

  if (order && ownerId && ["pending", "unknown", "failed"].includes(order.status)) {
    try { order = await reconcileInitialVisitOrder(ownerId, order.id); }
    catch { /* Keep checkout state unchanged when provider verification fails. */ }
  }

  const claimSuffix = isGuestOrder && query.claim ? `&claim=${encodeURIComponent(query.claim)}` : "";
  if (order?.status === "paid") {
    redirect(`/resonance/complete?order=${order.id}${claimSuffix}${roomSuffix}`);
  }

  const unusedVisits = userId ? await getVisitBalance(userId) : 0;
  const canResumeCheckout = order?.status === "pending" || order?.status === "failed";
  const checkoutOrigin =
    order?.whop_checkout_id && canResumeCheckout && checkoutEnabled
      ? (await whopVisitConfig()).origin
      : null;
  const checkoutReturnUrl = checkoutOrigin && order
    ? visitCheckoutReturnUrl(
        checkoutOrigin,
        order.id,
        isGuestOrder ? { claim: query.claim, room: roomTarget?.weekNumber } : { room: roomTarget?.weekNumber },
      )
    : null;

  return (
    <FunnelFrame>
      <div className={order ? "mx-auto max-w-xl" : undefined}>
        <p className="res-accent text-sm uppercase tracking-[0.2em]">Resonance visits</p>
        <h1 className="res-text mt-3 text-4xl font-light">Choose the visits. Choose the room next.</h1>
        <p className="res-text-primary mt-5 text-base leading-8">
          Each visit opens one seven-day room experience, starting when it is entered. Use different rooms or return to the same room for a fresh round. One visit is active at a time.
        </p>
        {roomTarget && !order ? (
          <p className="res-text-secondary mt-4 text-sm leading-7">
            You showed interest in {roomTarget.name}. We&apos;ll remember that through checkout, but the room is not locked in.
          </p>
        ) : null}
        {unusedVisits > 0 ? (
          <p className="res-text-primary mt-4">
            You have {unusedVisits} unused visit{unusedVisits === 1 ? "" : "s"}.{" "}
            <Link href={roomTarget?.entryPath ?? "/entry"} className="res-accent underline underline-offset-4">Choose a room with your visits</Link>
          </p>
        ) : null}
        {!checkoutEnabled ? <p role="status" className="res-text-primary mt-6">Package checkout is not open yet. Existing purchases remain available.</p> : null}
        {query.error ? (
          <p role="alert" className="res-alert mt-6">
            {query.error === "email"
              ? "Verify the primary email on this account before purchasing."
              : query.error === "admin-test"
                ? "The admin test purchase could not be recorded."
                : "Checkout could not be opened. No payment has been confirmed."}
          </p>
        ) : null}
      </div>

      {!order ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {INITIAL_QUANTITIES.map((quantity) => (
            <form key={quantity} action={purchaseVisits} className="res-border res-panel rounded-3xl border p-6">
              <h2 className="res-text text-2xl font-light">{quantity} visit{quantity === 1 ? "" : "s"}</h2>
              <p className="res-accent mt-4 text-3xl">{formatOremeaPrice(VISIT_PRICES[quantity])}</p>
              <p className="res-text-secondary mb-6 mt-2 text-sm">{quantity === 3 ? "About " : ""}{formatOremeaPrice(VISIT_PRICES[quantity] / quantity)} per visit</p>
              <input type="hidden" name="quantity" value={quantity} />
              {roomTarget ? <input type="hidden" name="room" value={roomTarget.weekNumber} /> : null}
              <input type="hidden" name="requestId" value={randomUUID()} />
              <VisitSubmitButton disabled={!checkoutEnabled}>Choose {quantity}</VisitSubmitButton>
            </form>
          ))}
        </div>
      ) : order.whop_checkout_id && canResumeCheckout && checkoutEnabled && checkoutReturnUrl ? (
        <section className="res-border res-panel mx-auto mt-8 max-w-xl rounded-3xl border p-6">
          <h2 className="res-text text-2xl">{order.quantity} visit{order.quantity === 1 ? "" : "s"} · {formatOremeaPrice(order.amount_cents)}</h2>
          <p className="res-text-secondary mt-3 text-sm leading-6">
            {isGuestOrder ? "Complete payment first. Your account is created only after the purchase is confirmed." : "Complete payment below."}
          </p>
          <Script src="https://js.whop.com/static/checkout/loader.js" strategy="afterInteractive" />
          <div
            key={order.id}
            className="mt-6 min-h-[420px]"
            data-whop-checkout-plan-id={order.whop_plan_id}
            data-whop-checkout-session={order.whop_checkout_id}
            data-whop-checkout-theme="dark"
            {...(isGuestOrder ? {} : {
              "data-whop-checkout-prefill-email": order.buyer_email,
              "data-whop-checkout-disable-email": "true",
            })}
            data-whop-checkout-setup-future-usage="off_session"
            data-whop-checkout-return-url={checkoutReturnUrl}
          />
        </section>
      ) : (
        <p role="status" className="res-text-primary mx-auto mt-8 max-w-xl text-base leading-8">
          This checkout could not be confirmed. No visits have been added for it. Contact support before retrying if you received a successful payment confirmation.
        </p>
      )}
    </FunnelFrame>
  );
}
