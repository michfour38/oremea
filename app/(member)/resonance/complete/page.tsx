import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RESONANCE_ROOM_MARKETING } from "@/src/lib/oremea/public-product-marketing";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { additionalOffers, VISIT_PRICES } from "@/src/lib/resonance/visit-offers";
import { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";
import { visitCheckoutAvailableFor, visitCreditsAvailableFor } from "@/src/lib/resonance/visit-access";
import { getVisitOrder, reconcileInitialVisitOrder } from "@/src/lib/resonance/visit-orders";
import { addVisits } from "../visits/actions";
import { FunnelFrame } from "../visits/funnel-frame";
import { VisitSubmitButton } from "../visits/submit-button";
import { AdditionalOfferPicker } from "./additional-offer-picker";

export const dynamic = "force-dynamic";

function CompleteTenAction({
  orderId,
  quantity,
  amountCents,
  canCharge,
  roomWeekNumber,
  label = "Complete ten",
}: {
  orderId: string;
  quantity: number;
  amountCents: number;
  canCharge: boolean;
  roomWeekNumber?: number;
  label?: string;
}) {
  return (
    <form action={addVisits} className="mx-auto w-full max-w-md">
      <input type="hidden" name="orderId" value={orderId} />
      {roomWeekNumber ? <input type="hidden" name="room" value={roomWeekNumber} /> : null}
      <input type="hidden" name="quantity" value={quantity} />
      <VisitSubmitButton disabled={!canCharge}>
        {label} · Pay {formatOremeaPrice(amountCents)}
      </VisitSubmitButton>
    </form>
  );
}

export default async function VisitCompletionPage({ searchParams }: {
  searchParams: Promise<{ order?: string; error?: string; room?: string | string[] }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCreditsAvailableFor(userId))) notFound();

  const query = await searchParams;
  const roomTarget = getResonanceRoomTarget(query.room);
  const roomSuffix = roomTarget ? `&room=${roomTarget.weekNumber}` : "";
  let order = query.order ? await getVisitOrder(userId, query.order) : null;
  if (!order) notFound();
  if (order.kind === "initial" && ["pending", "unknown", "failed"].includes(order.status)) {
    try { order = await reconcileInitialVisitOrder(userId, order.id); }
    catch { /* Whop may be temporarily unavailable; keep the order unconfirmed. */ }
    if (!order) notFound();
  }

  const child = order.kind === "initial"
    ? await prisma.resonance_visit_orders.findUnique({ where: { parent_id: order.id } })
    : null;
  if (child) redirect(`/resonance/complete?order=${child.id}${roomSuffix}`);

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
            <Link href={`/resonance/visits?order=${order.id}${roomSuffix}`} className="res-accent res-accent-hover text-base underline">
              Return to checkout
            </Link>
          ) : null}
          {order.status === "pending" || order.status === "unknown" ? (
            <a href={`/resonance/complete?order=${order.id}${roomSuffix}`} className="res-accent res-accent-hover text-base underline">
              Check payment status
            </a>
          ) : null}
          <Link href={roomTarget?.entryPath ?? "/entry"} className="res-accent res-accent-hover text-base underline">{roomTarget ? `Continue to ${roomTarget.name}` : "Choose my room"}</Link>
        </div>
      </FunnelFrame>
    );
  }

  const [complete, ...smaller] = additionalOffers(order.quantity);
  const canCharge = (await visitCheckoutAvailableFor(userId)) && Boolean(order.whop_member_id && order.whop_payment_method_id);
  const completeTotalCents = VISIT_PRICES[10];
  const completePerVisitCents = Math.round(completeTotalCents / 10);

  return (
    <FunnelFrame>
      <div className="pb-24">
        <header className="mx-auto max-w-3xl text-center">
          <p className="res-accent text-sm uppercase tracking-[0.24em]">
            {order.quantity === 1 ? "Your visit is purchased" : `Your ${order.quantity} visits are purchased`}
          </p>
          <h1 className="res-text mt-3 font-serif text-4xl md:text-5xl">Complete ten?</h1>
          <p className="res-text-primary mx-auto mt-5 max-w-2xl text-base leading-8">
            Your first purchase is already secure. Nothing on this page can take that away.
            This is simply the point where you can complete the ten-visit set now, compare a smaller addition once, or keep exactly what you already bought and move straight into a room.
          </p>
        </header>

        {query.error ? (
          <p role="alert" className="res-alert mx-auto mt-6 max-w-2xl">
            The additional purchase could not be started. Your original visits remain available.
          </p>
        ) : null}

        <AdditionalOfferPicker
          orderId={order.id}
          currentQuantity={order.quantity}
          currentPaidCents={order.amount_cents}
          completeQuantity={complete.quantity}
          completeAmountCents={complete.amountCents}
          completeTotalCents={completeTotalCents}
          smallerOffers={smaller.map((offer) => ({
            quantity: offer.quantity,
            amountCents: offer.amountCents,
          }))}
          canCharge={canCharge}
          roomWeekNumber={roomTarget?.weekNumber}
        />

        <p className="res-text-secondary mx-auto mt-5 max-w-2xl text-center text-sm leading-7">
          {canCharge
            ? "Any accepted addition is a separate charge using the saved payment method. A bank may still require verification."
            : "A saved-payment addition is not available for this checkout. Your purchased visits can be used now."}
        </p>

        <section className="res-border res-panel mx-auto mt-16 max-w-4xl rounded-[2rem] border p-7 md:p-10">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">Your first visit is already yours</p>
          <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">Completing ten adds capacity, not pressure.</h2>
          <div className="res-text-primary mt-7 grid gap-6 text-base leading-8 md:grid-cols-2">
            <p>
              Completing ten does not start ten rooms, lock in an order, or ask you to know what will matter later. It simply leaves ten visit credits available on the account, ready for whichever relational territory becomes relevant next.
            </p>
            <p>
              One room is active at a time. Every visit remains separate, and returning to a room later creates a fresh visit without rewriting the earlier one.
            </p>
          </div>
          <div className="mt-8">
            <CompleteTenAction
              orderId={order.id}
              quantity={complete.quantity}
              amountCents={complete.amountCents}
              canCharge={canCharge}
          roomWeekNumber={roomTarget?.weekNumber}
            />
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-4xl">
          <div className="max-w-2xl">
            <p className="res-accent text-xs uppercase tracking-[0.28em]">What the complete set changes</p>
            <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">The decision moves from buying access to deciding when to use it.</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Ten visits available", "The full set sits on the account until each visit is opened. Unused capacity remains available."],
              ["No required sequence", "The ten rooms are not a ladder. A future visit can enter whichever territory matches what is present then."],
              ["One active room", "Only one room is active at a time, so the experience stays contained even when more visits are already available."],
            ].map(([heading, copy]) => (
              <article key={heading} className="res-border res-panel rounded-3xl border p-6 md:p-7">
                <h3 className="res-accent text-sm font-medium">{heading}</h3>
                <p className="res-text-primary mt-4 text-sm leading-7">{copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <CompleteTenAction
              orderId={order.id}
              quantity={complete.quantity}
              amountCents={complete.amountCents}
              canCharge={canCharge}
          roomWeekNumber={roomTarget?.weekNumber}
              label="Keep all ten available"
            />
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="res-accent text-xs uppercase tracking-[0.28em]">Ten rooms · any order</p>
            <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">The full set keeps every territory within reach.</h2>
            <p className="res-text-primary mt-5 text-base leading-8">
              Each room stands on its own. A later visit can enter a different territory or return to one already completed without altering what came before.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {RESONANCE_ROOM_MARKETING.map((room) => (
              <article key={room.id} className="res-border res-panel flex h-full flex-col rounded-3xl border p-6 md:p-7">
                <p className="res-accent text-xs uppercase tracking-[0.2em]">Room {room.weekNumber}</p>
                <h3 className="res-text mt-3 font-serif text-2xl">{room.headline}</h3>
                <p className="res-text-primary mt-4 text-sm leading-7">{room.description}</p>
                <div className="mt-auto pt-6">
                  <div className="flex h-14 items-center border-l border-[var(--product-accent-border)] pl-4">
                    <p className="res-text-secondary line-clamp-2 text-sm leading-7">{room.buyerDecision}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10">
            <CompleteTenAction
              orderId={order.id}
              quantity={complete.quantity}
              amountCents={complete.amountCents}
              canCharge={canCharge}
          roomWeekNumber={roomTarget?.weekNumber}
              label="Complete the ten-room set"
            />
          </div>
        </section>

        <section className="res-border res-panel mx-auto mt-20 max-w-4xl rounded-[2rem] border p-7 md:p-10">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">The practical part</p>
          <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">What completing ten costs from here.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="res-border res-panel-soft rounded-2xl border p-5">
              <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">Already paid</p>
              <p className="res-text mt-2 text-2xl">{formatOremeaPrice(order.amount_cents)}</p>
            </div>
            <div className="res-border res-panel-soft rounded-2xl border p-5">
              <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">Add now</p>
              <p className="res-text mt-2 text-2xl">{formatOremeaPrice(complete.amountCents)}</p>
            </div>
            <div className="res-border res-panel-soft rounded-2xl border p-5">
              <p className="res-text-secondary text-xs uppercase tracking-[0.16em]">Ten total</p>
              <p className="res-text mt-2 text-2xl">{formatOremeaPrice(completeTotalCents)}</p>
            </div>
          </div>
          <p className="res-text-primary mt-6 text-base leading-8">
            At the complete-set total, the overall rate is {formatOremeaPrice(completePerVisitCents)} per visit. The additional charge is separate from the purchase you have already completed.
          </p>
          <div className="mt-8">
            <CompleteTenAction
              orderId={order.id}
              quantity={complete.quantity}
              amountCents={complete.amountCents}
              canCharge={canCharge}
          roomWeekNumber={roomTarget?.weekNumber}
              label="Complete ten now"
            />
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-3xl text-center">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">No pressure to decide more</p>
          <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">Your purchased visit remains ready either way.</h2>
          <p className="res-text-primary mt-5 text-base leading-8">
            The floating “No thanks · Choose my room” option stays visible while you read this page so leaving the offer never becomes something you have to hunt for.
          </p>
        </section>
      </div>
    </FunnelFrame>
  );
}
