"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requestAffiliateCode } from "@/src/lib/whop/affiliate-request";
import { acceptVisitAddition, declineVisitAddition, redeemVisit, startVisitPurchase } from "@/src/lib/resonance/visit-orders";
import { visitCheckoutAvailableFor, visitCreditsAvailableFor } from "@/src/lib/resonance/visit-access";
import { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";

function formRoomTarget(form: FormData) {
  const room = form.get("room");
  return getResonanceRoomTarget(typeof room === "string" ? room : undefined);
}

function withRoom(path: string, weekNumber?: number) {
  if (!weekNumber) return path;
  return `${path}${path.includes("?") ? "&" : "?"}room=${weekNumber}`;
}

export async function purchaseVisits(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const user = await currentUser();
  if (!user) {
    const target = withRoom("/resonance/visits", roomTarget?.weekNumber);
    redirect(`/sign-in?redirect_url=${encodeURIComponent(target)}`);
  }
  if (!(await visitCheckoutAvailableFor(user.id))) redirect(withRoom("/resonance/visits?error=unavailable", roomTarget?.weekNumber));
  const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  if (!email || email.verification?.status !== "verified") redirect(withRoom("/resonance/visits?error=email", roomTarget?.weekNumber));
  let orderId: string | null = null;
  try {
    orderId = await startVisitPurchase(user.id, email.emailAddress, Number(form.get("quantity")), String(form.get("requestId")), await requestAffiliateCode());
  } catch {
    // Do not expose raw provider errors or account data.
  }
  if (!orderId) redirect(withRoom("/resonance/visits?error=checkout", roomTarget?.weekNumber));
  redirect(withRoom(`/resonance/visits?order=${orderId}`, roomTarget?.weekNumber));
}

export async function addVisits(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCheckoutAvailableFor(userId))) redirect(roomTarget?.entryPath ?? "/entry");
  const parentId = String(form.get("orderId"));
  let orderId: string | null = null;
  try { orderId = await acceptVisitAddition(userId, parentId, Number(form.get("quantity"))); } catch { /* Show a safe error on the original order. */ }
  if (!orderId) redirect(withRoom(`/resonance/complete?order=${encodeURIComponent(parentId)}&error=addition`, roomTarget?.weekNumber));
  redirect(withRoom(`/resonance/complete?order=${orderId}`, roomTarget?.weekNumber));
}

export async function skipAddition(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCreditsAvailableFor(userId))) redirect(roomTarget?.entryPath ?? "/entry");
  try { await declineVisitAddition(userId, String(form.get("orderId"))); } catch { /* Skipping never blocks purchased access. */ }
  redirect(roomTarget?.entryPath ?? "/entry");
}

export async function enterVisitRoom(form: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCreditsAvailableFor(userId))) redirect("/entry");
  let entered = false;
  try {
    await redeemVisit(userId, Number(form.get("weekNumber")), String(form.get("requestId")));
    entered = true;
  } catch { /* No debit occurs if a room cannot be opened. */ }
  revalidatePath("/entry");
  if (!entered) redirect("/entry?visitError=1");
  redirect("/resonance");
}
