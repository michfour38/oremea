import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Playfair_Display } from "next/font/google";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export default async function ResonanceEnterPage() {
  const { userId } = await auth();
  const entryHref = userId
    ? "/entry"
    : `/sign-up?redirect_url=${encodeURIComponent("/entry")}`;

  return (
    <main id="top" className="relative min-h-screen overflow-x-hidden text-white">
      <SiteNav />

      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
          style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
          style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 md:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <img
            src="/images/oremea-logo-wht.png"
            alt="Oremea"
            className="mx-auto h-16 w-auto md:h-24"
          />

          <p className="mt-8 text-sm uppercase tracking-[0.32em] text-[#c8a96a]/80 md:text-base">
            Resonance by Oremea
          </p>

          <h1
            className={`${playfair.className} mt-4 text-4xl font-semibold leading-[0.98] tracking-tight md:text-6xl`}
          >
            Stay with what becomes visible.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-200 md:text-lg">
            Resonance is a private seven-day reflection experience. Ten thematic
            rooms are available, and each visit opens one room for seven days.
          </p>
        </header>

        <section className="mx-auto mt-12 max-w-3xl rounded-[2rem] border border-white/10 bg-black/40 p-7 backdrop-blur-[2px] md:p-9">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#c8a96a]/70">
                One room · one visit
              </p>
              <h2 className={`${playfair.className} mt-3 text-3xl text-white`}>
                Seven days of Resonance
              </h2>
            </div>
            <p className="text-2xl text-[#c8a96a]">$5</p>
          </div>

          <div className="mt-6 grid gap-5 text-sm leading-7 text-zinc-300 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-black/25 p-5">
              <p className="text-zinc-100">Days 1–6</p>
              <p className="mt-2">
                Private reflections are followed by two questions drawn from that
                day&apos;s own material, then the journey continues directly into the
                next day.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/25 p-5">
              <p className="text-zinc-100">Day 7</p>
              <p className="mt-2">
                The final reflections and 2Q open a cumulative Mirror that reads the
                Resonance journey completed so far and reflects what persists,
                changes, and becomes more precise.
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-7 text-zinc-300">
            The ten rooms can be visited in the order that fits the participant.
            One visit remains active at a time. A completed room stays available in
            the archive, and a later purchase opens a fresh visit while preserving
            the earlier one.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href={entryHref}
              className="inline-flex rounded-xl border border-[#c8a96a]/60 px-6 py-3 text-sm text-[#c8a96a] transition hover:bg-[#c8a96a]/10"
            >
              {userId ? "Choose a Resonance room" : "Create account and choose a room"}
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-3xl space-y-4">
          <details className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <summary className="cursor-pointer text-sm text-zinc-100">
              Returning to a room
            </summary>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Each return creates a separate visit. Earlier reflections, 2Q, and
              Mirrors remain intact. Once the newer visit closes, the two visits can
              be viewed side by side so differences in the participant&apos;s own
              language are visible without shaping the newer responses in advance.
            </p>
          </details>

          <details className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <summary className="cursor-pointer text-sm text-zinc-100">
              The role of Mirror
            </summary>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Daily 2Q holds the questioning function. The cumulative Mirror arrives
              after Day 7 and reads participant reflections and participant-written
              2Q answers as evidence. Earlier generated questions and Mirrors provide
              continuity context so the reflection can remain fresh and grounded.
            </p>
          </details>
        </section>
      </div>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </main>
  );
}
