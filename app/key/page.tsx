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

        <div className="mt-8">
          <h2 className="text-2xl font-light text-zinc-100">Use your Golden Key</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
            Enter the live product directly. Each product re-checks the signed-in Golden Key before granting access.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <KeyProductLink
              href="https://recognition.oremea.com/begin"
              title="Recognition"
              detail="Enter Recognition · ∞"
            />
            <KeyProductLink
              href="https://resonance.oremea.com/"
              title="Resonance"
              detail="Choose a room · ∞"
            />
            <KeyProductLink
              href="https://compass.oremea.com/begin"
              title="Compass"
              detail="Enter Compass · ∞"
            />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function KeyProductLink({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <a
      href={href}
      className="rounded-[1.5rem] border border-[#C8A96A]/25 bg-black/40 p-5 transition hover:border-[#C8A96A]/60 hover:bg-[#C8A96A]/[0.05]"
    >
      <span className="block text-lg text-zinc-100">{title}</span>
      <span className="mt-2 block text-xs uppercase tracking-[0.16em] text-[#E7C98B]">
        {detail}
      </span>
    </a>
  );
}
