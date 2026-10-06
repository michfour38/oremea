import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SiteShell } from "@/components/site/site-shell";
import { getCreatorSilverKeyInfo } from "@/lib/auth/creator-silver-key";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function accessLabel(activatedAt: Date | null, expiresAt: Date | null) {
  if (!activatedAt || !expiresAt) return "30 days · starts when you first enter";
  return `Active until ${expiresAt.toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
  })}`;
}

export default async function CreatorSilverKeyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fkey%2Fsilver");

  const info = await getCreatorSilverKeyInfo(userId);
  if (!info) redirect("/profile");

  const params = await searchParams;
  const claimed = params.claimed === "1";

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-5xl px-6 py-12 md:px-10 md:py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-300">
          Oremea Creator Silver Key
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-light tracking-tight text-zinc-100 md:text-6xl">
          Experience it before deciding whether it belongs in your world
        </h1>

        {claimed ? (
          <div className="mt-8 rounded-2xl border border-zinc-300/25 bg-zinc-200/[0.06] px-5 py-4 text-sm text-zinc-200">
            Your Creator Silver Key is ready
          </div>
        ) : null}

        <div className="mt-10 rounded-[2rem] border border-zinc-300/20 bg-black/45 p-6 md:p-8">
          <h2 className="text-2xl font-light text-zinc-100">How your access works</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">
            Your Recognition and Compass access do not start when your Silver Key is issued. Each 30-day access period begins only when you first enter that product, so exploring Recognition today will not reduce your Compass time. Your three Resonance room credits remain available until you use them.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <ProductCard
            title="Recognition"
            access={accessLabel(
              info.recognition.activatedAt,
              info.recognition.expiresAt,
            )}
            body="A private AI discussion journal for thoughts that need more than a journal page. Recognition stays close to your own words, follows the thread, reflects what becomes significant and asks one focused question at a time."
            href="https://recognition.oremea.com/begin"
            cta={info.recognition.activatedAt ? "Continue Recognition" : "Enter Recognition"}
          />

          <ProductCard
            title="Resonance"
            access={`${info.resonance.remaining} of ${info.resonance.total} room credits remaining`}
            body="Choose any three of the ten seven-day rooms. You can choose three different rooms or return to the same room for a fresh visit. One room remains active at a time and unused credits stay available for later."
            href="https://resonance.oremea.com/"
            cta="Choose a Resonance room"
          />

          <ProductCard
            title="Compass"
            access={accessLabel(info.compass.activatedAt, info.compass.expiresAt)}
            body="A private goal-setting and next-step process. Compass takes what you want through seven layers of why, then helps turn what becomes clear into a next step you can actually take."
            href="https://compass.oremea.com/begin"
            cta={info.compass.activatedAt ? "Continue Compass" : "Enter Compass"}
          />
        </div>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/35 p-6 md:p-8">
          <h2 className="text-2xl font-light text-zinc-100">No performance required</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
            There is no requirement to post, review or promote Oremea. Use it first. A Creator Silver Key is not Lifetime All Access, a subscription, a discount, store credit or automatic enrolment in the Creator Partner programme. Future Oremea products are not automatically included. If Oremea genuinely fits the conversations you already have with your audience, a Creator Partner invitation can happen separately.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}

function ProductCard({
  title,
  access,
  body,
  href,
  cta,
}: {
  title: string;
  access: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-black/40 p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{access}</p>
      <h2 className="mt-3 text-3xl font-light text-zinc-100">{title}</h2>
      <p className="mt-4 flex-1 text-sm leading-7 text-zinc-400">{body}</p>
      <Link
        href={href}
        className="mt-6 inline-flex w-fit rounded-full border border-zinc-300/30 bg-zinc-200/[0.06] px-5 py-3 text-xs uppercase tracking-[0.16em] text-zinc-200 transition hover:border-zinc-200/60"
      >
        {cta}
      </Link>
    </article>
  );
}
