import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { SiteShell } from "@/components/site/site-shell";
import { CurrentPanel } from "@/components/site/sections/current-panel";
import { getOremeaMemberState } from "@/src/lib/current/current-access";

export const dynamic = "force-dynamic";

export default async function CurrentPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const emails =
    user?.emailAddresses
      .map((item) => item.emailAddress.trim().toLowerCase())
      .filter(Boolean) ?? [];
  const memberState = await getOremeaMemberState({ userId, emails });

  // The Current is not a public lead surface. A signed-in account still needs
  // a real Oremea purchase record before this route exists for that person.
  if (!memberState.member) notFound();

  return (
    <SiteShell>
      <CurrentPanel />
    </SiteShell>
  );
}
