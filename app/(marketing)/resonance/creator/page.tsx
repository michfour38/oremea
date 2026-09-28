import { redirect } from "next/navigation";

// Existing creator links keep their referral cookie through middleware, then
// enter the same customer visit chooser and prices as every other buyer.
export default function CreatorResonancePage() {
  redirect("/resonance/visits");
}
