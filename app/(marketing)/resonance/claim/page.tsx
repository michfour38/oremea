import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { FunnelFrame } from "@/app/(member)/resonance/visits/funnel-frame";
import { guestClaimPath, guestOwnerFromClaim } from "@/src/lib/resonance/guest-visit-identity";
import { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";
import { claimGuestVisitPurchase, getVisitOrder, reconcileInitialVisitOrder } from "@/src/lib/resonance/visit-orders";

export const dynamic = "force-dynamic";

export default async function ResonanceClaimPage({ searchParams }: {
  searchParams: Promise<{ order?: string; claim?: string; room?: string | string[] }>;
}) {
  const query = await searchParams;
  const orderId = query.order ?? "";
  const claim = query.claim ?? "";
  const guestOwner = guestOwnerFromClaim(claim);
  const roomTarget = getResonanceRoomTarget(query.room);
  if (!guestOwner || !orderId) notFound();

  const { userId } = await auth();
  let order = await getVisitOrder(guestOwner, orderId);

  if (!order && userId) {
    const alreadyClaimed = await getVisitOrder(userId, orderId);
    if (alreadyClaimed?.status === "paid") redirect(roomTarget?.entryPath ?? "/entry");
  }
  if (!order || order.kind !== "initial") notFound();

  if (["pending", "unknown", "failed"].includes(order.status)) {
    try { order = await reconcileInitialVisitOrder(guestOwner, order.id) ?? order; }
    catch { /* A signed webhook can still settle the same order. */ }
  }

  if (order.status !== "paid") {
    const returnPath = `/resonance/complete?order=${encodeURIComponent(order.id)}&claim=${encodeURIComponent(claim)}${roomTarget ? `&room=${roomTarget.weekNumber}` : ""}`;
    return (
      <FunnelFrame>
        <div className="mx-auto max-w-xl text-center">
          <p className="res-accent text-sm uppercase tracking-[0.22em]">Resonance purchase</p>
          <h1 className="res-text mt-3 text-4xl font-light">Payment is still being confirmed.</h1>
          <p className="res-text-primary mt-5 text-base leading-8">
            No account claim or visit credit happens until Whop confirms the payment.
          </p>
          <Link href={returnPath} className="res-action mt-8 inline-flex rounded-xl border px-6 py-3 text-sm font-medium transition">
            Check payment status
          </Link>
        </div>
      </FunnelFrame>
    );
  }

  const claimPath = guestClaimPath(order.id, claim, roomTarget?.weekNumber);

  if (!userId) {
    return (
      <FunnelFrame>
        <div className="mx-auto max-w-xl text-center">
          <p className="res-accent text-sm uppercase tracking-[0.22em]">Purchase confirmed</p>
          <h1 className="res-text mt-3 font-serif text-4xl md:text-5xl">Keep your Resonance visits.</h1>
          <p className="res-text-primary mt-5 text-base leading-8">
            Your payment is confirmed. Create your Oremea account now, using the same email address you used at checkout. Your purchased visits will attach to that account automatically.
          </p>
          {roomTarget ? (
            <p className="res-text-secondary mt-4 text-sm leading-7">
              We still remember that you showed interest in {roomTarget.name}. You can keep that starting point or compare the rooms after your account is ready.
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={`/sign-up?redirect_url=${encodeURIComponent(claimPath)}`}
              className="res-action inline-flex rounded-xl border px-6 py-3 text-sm font-medium transition"
            >
              Create my account
            </Link>
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(claimPath)}`}
              className="res-secondary-action inline-flex rounded-xl border px-6 py-3 text-sm transition"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </FunnelFrame>
    );
  }

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  const emailMatches = Boolean(
    primaryEmail?.verification?.status === "verified" &&
    primaryEmail.emailAddress.toLowerCase() === order.buyer_email.toLowerCase(),
  );

  if (!emailMatches) {
    return (
      <FunnelFrame>
        <div className="mx-auto max-w-xl text-center">
          <p className="res-accent text-sm uppercase tracking-[0.22em]">Purchase confirmed</p>
          <h1 className="res-text mt-3 text-4xl font-light">Use the checkout email for this account.</h1>
          <p className="res-text-primary mt-5 text-base leading-8">
            The visits can only be claimed by an Oremea account with a verified primary email matching the email used for the Whop payment. This protects a paid purchase from being claimed by the wrong account.
          </p>
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(claimPath)}`}
            className="res-action mt-8 inline-flex rounded-xl border px-6 py-3 text-sm font-medium transition"
          >
            Sign in with the checkout email
          </Link>
        </div>
      </FunnelFrame>
    );
  }

  try {
    await claimGuestVisitPurchase(guestOwner, order.id, userId, primaryEmail!.emailAddress);
  } catch {
    return (
      <FunnelFrame>
        <div className="mx-auto max-w-xl text-center">
          <p className="res-accent text-sm uppercase tracking-[0.22em]">Purchase confirmed</p>
          <h1 className="res-text mt-3 text-4xl font-light">The purchase is safe, but it could not attach yet.</h1>
          <p className="res-text-primary mt-5 text-base leading-8">
            Your payment remains recorded. Reload this page with the same account before making another purchase.
          </p>
        </div>
      </FunnelFrame>
    );
  }

  redirect(roomTarget?.entryPath ?? "/entry");
}
