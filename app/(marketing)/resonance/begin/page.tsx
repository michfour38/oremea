import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ResonanceBeginPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/resonance/enter");
  }

  // The former /begin route granted blanket Resonance access after a Paystack
  // return. Resonance is now purchased one week-run at a time from /entry.
  redirect("/entry");
}
