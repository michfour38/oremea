"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const MIRROR_UPGRADE_PAYSTACK_URL = "https://paystack.shop/pay/3utxqlehqj";

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

async function getSignedInEmail() {
  const user = await currentUser();

  const primaryEmail =
    user?.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";

  return normalizeEmail(primaryEmail);
}

export async function unlockFullMirrorAction(formData: FormData) {
  const email = await getSignedInEmail();

  if (!email) {
    redirect("/sign-in?redirect_url=/mirror/unlock");
  }

  const weekNumber = Number(formData.get("weekNumber")) || 1;
  const dayNumber = Number(formData.get("dayNumber")) || 1;

  const params = new URLSearchParams();

  params.set("email", email);
  params.set("plan", "mirror");
  params.set("upgrade", "true");
  params.set("weekNumber", String(weekNumber));
  params.set("dayNumber", String(dayNumber));

  redirect(`${MIRROR_UPGRADE_PAYSTACK_URL}?${params.toString()}`);
}

export async function unlockLiteMirrorAction() {
  redirect("/journey");
}