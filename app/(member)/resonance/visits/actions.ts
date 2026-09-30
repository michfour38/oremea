"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requestAffiliateCode } from "@/src/lib/whop/affiliate-request";
import { acceptVisitAddition, declineVisitAddition, getVisitOrder, redeemVisit, startVisitPurchase } from "@/src/lib/resonance/visit-orders";
import { visitCheckoutAvailableFor, visitCreditsAvailableFor } from "@/src/lib/resonance/visit-access";
import { visitCheckoutEnabled } from "@/src/lib/resonance/visit-offers";
import { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";
import { createGuestVisitClaim, guestClaimPath, guestOwnerFromClaim, pendingGuestEmail } from "@/src/lib/resonance/guest-visit-identity";
import { isOremeaAdmin } from "@/lib/auth/admin-access";
import {
  ensureAdminTestVisitCredit,
  simulateAdminInitialVisitPurchase,
  simulateAdminVisitAddition,
} from "@/src/lib/resonance/admin-test-commerce";

function formRoomTarget(form: FormData) {
  const room = form.get("room");
  return getResonanceRoomTarget(typeof room === "string" ? room : undefined);
}

function formClaim(form: FormData) {
  const value = form.get("claim");
  return typeof value === "string" ? value : null;
}

function withRoom(path: string, weekNumber?: number) {
  if (!weekNumber) return path;
  return `${path}${path.includes("?") ? "&" : "?"}room=${weekNumber}`;
}

function withGuestClaim(path: string, claim: string, weekNumber?: number) {
  const separator = path.includes("?") ? "&" : "?";
  const params = new URLSearchParams({ claim });
  if (weekNumber) params.set("room", String(weekNumber));
  return `${path}${separator}${params.toString()}`;
}

export async function purchaseVisits(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const user = await currentUser();
  const quantity = Number(form.get("quantity"));
  const requestId = String(form.get("requestId"));

  if (!user) {
    if (!visitCheckoutEnabled()) {
      redirect(withRoom("/resonance/visits?error=unavailable", roomTarget?.weekNumber));
    }

    const claim = createGuestVisitClaim();
    const guestOwner = guestOwnerFromClaim(claim);
    if (!guestOwner) redirect(withRoom("/resonance/visits?error=checkout", roomTarget?.weekNumber));

    let orderId: string | null = null;
    try {
      orderId = await startVisitPurchase(
        guestOwner,
        pendingGuestEmail(requestId),
        quantity,
        requestId,
        await requestAffiliateCode(),
        { claim, room: roomTarget?.weekNumber },
      );
    } catch {
      // Never expose raw provider or account data on a public checkout surface.
    }

    if (!orderId) redirect(withRoom("/resonance/visits?error=checkout", roomTarget?.weekNumber));
    redirect(withGuestClaim(`/resonance/visits?order=${orderId}`, claim, roomTarget?.weekNumber));
  }

  const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  if (await isOremeaAdmin(user.id)) {
    let orderId: string | null = null;
    try {
      orderId = await simulateAdminInitialVisitPurchase({
        userId: user.id,
        email: email?.emailAddress ?? "admin-test@oremea.invalid",
        quantity,
        requestId,
      });
    } catch {
      // Keep admin test failures inside the same safe funnel surface.
    }
    if (!orderId) redirect(withRoom("/resonance/visits?error=admin-test", roomTarget?.weekNumber));
    redirect(withRoom(`/resonance/complete?order=${orderId}`, roomTarget?.weekNumber));
  }

  if (!(await visitCheckoutAvailableFor(user.id))) redirect(withRoom("/resonance/visits?error=unavailable", roomTarget?.weekNumber));
  if (!email || email.verification?.status !== "verified") redirect(withRoom("/resonance/visits?error=email", roomTarget?.weekNumber));
  let orderId: string | null = null;
  try {
    orderId = await startVisitPurchase(user.id, email.emailAddress, quantity, requestId, await requestAffiliateCode());
  } catch {
    // Do not expose raw provider errors or account data.
  }
  if (!orderId) redirect(withRoom("/resonance/visits?error=checkout", roomTarget?.weekNumber));
  redirect(withRoom(`/resonance/visits?order=${orderId}`, roomTarget?.weekNumber));
}

export async function simulateAdminPurchase(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!(await isOremeaAdmin(user.id))) redirect("/resonance/visits");

  const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  let orderId: string | null = null;
  try {
    orderId = await simulateAdminInitialVisitPurchase({
      userId: user.id,
      email: email?.emailAddress ?? "admin-test@oremea.invalid",
      quantity: Number(form.get("quantity")),
      requestId: String(form.get("requestId")),
    });
  } catch {
    // Keep admin test failures inside the same safe funnel surface.
  }

  if (!orderId) redirect(withRoom("/resonance/visits?error=admin-test", roomTarget?.weekNumber));
  redirect(withRoom(`/resonance/complete?order=${orderId}`, roomTarget?.weekNumber));
}

export async function addVisits(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const claim = formClaim(form);
  const guestOwner = guestOwnerFromClaim(claim);
  const parentId = String(form.get("orderId"));

  if (guestOwner && claim) {
    const parent = await getVisitOrder(guestOwner, parentId);
    if (!parent || parent.kind !== "initial" || parent.status !== "paid") {
      redirect(withGuestClaim(`/resonance/complete?order=${encodeURIComponent(parentId)}&error=addition`, claim, roomTarget?.weekNumber));
    }
    if (!visitCheckoutEnabled()) redirect(guestClaimPath(parentId, claim, roomTarget?.weekNumber));

    let orderId: string | null = null;
    try {
      orderId = await acceptVisitAddition(guestOwner, parentId, Number(form.get("quantity")));
    } catch {
      // The original paid purchase remains intact when an addition fails.
    }
    if (!orderId) redirect(withGuestClaim(`/resonance/complete?order=${encodeURIComponent(parentId)}&error=addition`, claim, roomTarget?.weekNumber));
    redirect(withGuestClaim(`/resonance/complete?order=${orderId}`, claim, roomTarget?.weekNumber));
  }

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCheckoutAvailableFor(userId))) redirect(roomTarget?.entryPath ?? "/entry");
  let orderId: string | null = null;
  try {
    orderId = (await isOremeaAdmin(userId))
      ? await simulateAdminVisitAddition({
          userId,
          parentId,
          quantity: Number(form.get("quantity")),
        })
      : await acceptVisitAddition(userId, parentId, Number(form.get("quantity")));
  } catch {
    // Show a safe error on the original order.
  }
  if (!orderId) redirect(withRoom(`/resonance/complete?order=${encodeURIComponent(parentId)}&error=addition`, roomTarget?.weekNumber));
  redirect(withRoom(`/resonance/complete?order=${orderId}`, roomTarget?.weekNumber));
}

export async function skipAddition(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const claim = formClaim(form);
  const guestOwner = guestOwnerFromClaim(claim);
  const orderId = String(form.get("orderId"));

  if (guestOwner && claim) {
    const order = await getVisitOrder(guestOwner, orderId);
    if (!order || order.kind !== "initial" || order.status !== "paid") {
      redirect(withRoom("/resonance/visits", roomTarget?.weekNumber));
    }
    try { await declineVisitAddition(guestOwner, orderId); } catch { /* Skipping never blocks purchased access. */ }
    redirect(guestClaimPath(orderId, claim, roomTarget?.weekNumber));
  }

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCreditsAvailableFor(userId))) redirect(roomTarget?.entryPath ?? "/entry");
  try { await declineVisitAddition(userId, orderId); } catch { /* Skipping never blocks purchased access. */ }
  redirect(roomTarget?.entryPath ?? "/entry");
}

export async function enterVisitRoom(form: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCreditsAvailableFor(userId))) redirect("/entry");
  let entered = false;
  try {
    if (await isOremeaAdmin(userId)) {
      await ensureAdminTestVisitCredit(userId);
    }
    await redeemVisit(userId, Number(form.get("weekNumber")), String(form.get("requestId")));
    entered = true;
  } catch { /* No debit occurs if a room cannot be opened. */ }
  revalidatePath("/entry");
  if (!entered) redirect("/entry?visitError=1");
  redirect("/resonance");
}
