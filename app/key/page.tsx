import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { EternalKeyCard } from "@/components/site/eternal-key-card";
import { SiteShell } from "@/components/site/site-shell";
import { getAccountAccess } from "@/lib/auth/account-access";

export const dynamic = "force-dynamic";

export default async function OremeaKeyPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const access = await getAccountAccess(userId);

  if (!access.hasEternalKey) {
    redirect("/profile");
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-4xl px-6 py-12 md:px-10 md:py-20">
        <p className="mb-7 max-w-2xl text-sm leading-7 text-zinc-400">
          This key belongs to the signed-in Oremea identity and remains attached to that identity permanently.
        </p>
        <EternalKeyCard />
      </section>
    </SiteShell>
  );
}
