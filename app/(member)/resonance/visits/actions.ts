"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { acceptVisitAddition, declineVisitAddition, redeemVisit, startVisitPurchase } from "@/src/lib/resonance/visit-orders";
import { visitCheckoutEnabled, visitsEnabled } from "@/src/lib/resonance/visit-offers";

export async function purchaseVisits(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in?redirect_url=%2Fresonance%2Fvisits");
  if (!visitCheckoutEnabled()) redirect("/resonance/visits?error=unavailable");
  const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  if (!email || email.verification?.status !== "verified") redirect("/resonance/visits?error=email");
  let orderId: string | null = null;
  try {
    orderId = await startVisitPurchase(user.id, email.emailAddress, Number(form.get("quantity")), String(form.get("requestId")));
  } catch {
    // Do not expose raw provider errors or account data.
  }
  if (!orderId) redirect("/resonance/visits?error=checkout");
  redirect(`/resonance/visits?order=${orderId}`);
}

export async function addVisits(form: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!visitCheckoutEnabled()) redirect("/entry");
  const parentId = String(form.get("orderId"));
  let orderId: string | null = null;
  try { orderId = await acceptVisitAddition(userId, parentId, Number(form.get("quantity"))); } catch { /* Show a safe error on the original order. */ }
  if (!orderId) redirect(`/resonance/complete?order=${encodeURIComponent(parentId)}&error=addition`);
  redirect(`/resonance/complete?order=${orderId}`);
}

export async function skipAddition(form: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!visitsEnabled()) redirect("/entry");
  try { await declineVisitAddition(userId, String(form.get("orderId"))); } catch { /* Skipping never blocks purchased access. */ }
  redirect("/entry");
}

export async function enterVisitRoom(form: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!visitsEnabled()) redirect("/entry");
  let entered = false;
  try {
    await redeemVisit(userId, Number(form.get("weekNumber")), String(form.get("requestId")));
    entered = true;
  } catch { /* No debit occurs if a room cannot be opened. */ }
  revalidatePath("/entry");
  if (!entered) redirect("/entry?visitError=1");
  redirect("/resonance");
}
