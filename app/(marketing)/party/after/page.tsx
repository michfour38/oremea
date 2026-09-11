import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

export const metadata = {
  title: "Continue with Resonance | Oremea",
  description: "Continue from the Oremea live session into Resonance only if a relational theme is ready for focused participation.",
};

export default function PartyAfterPage() {
  return (
    <main className="min-h-screen bg-[#080704] text-white">
      <SiteNav />
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <p className="text-sm uppercase tracking-[0.24em] text-[#c8a96a]">
          After the live session
        </p>
        <h1 className="mt-5 max-w-3xl font-serif text-4xl font-light leading-tight md:text-6xl">
          If one theme is clear enough to stay with, Resonance is here.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
          Nothing from the session requires another step. Resonance is available when a relational theme is worth holding under focused attention for seven private days.
        </p>

        <div className="mt-10 rounded-[2rem] border border-[#c8a96a]/35 bg-[#15120c] p-7 md:p-9">
          <h2 className="font-serif text-3xl">Choose visits first. Choose the room next.</h2>
          <p className="mt-4 text-lg leading-8 text-zinc-300">
            One visit opens one seven-day room. Additional visits remain available until a different room—or a fresh round in the same room—becomes relevant.
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href="/resonance/visits"
              className="rounded-full border border-[#c8a96a]/60 bg-[#c8a96a]/10 px-6 py-3 text-lg text-[#f1dfb4]"
            >
              Choose Resonance visits
            </Link>
            <Link
              href="/party"
              className="rounded-full border border-white/15 px-6 py-3 text-lg text-zinc-200"
            >
              Return to the live-session page
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
