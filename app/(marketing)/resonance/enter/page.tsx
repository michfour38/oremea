import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { visitCheckoutAvailableFor } from "@/src/lib/resonance/visit-access";

// Legacy visit-route contract marker: Choose the visits first. Choose the room next.
export default async function ResonanceEnterPage() {
  const { userId } = await auth();
  const checkoutEnabled = userId ? await visitCheckoutAvailableFor(userId) : false;
  const destination = checkoutEnabled ? "/resonance/visits" : "/entry";
  const entryHref = userId
    ? destination
    : `/sign-up?redirect_url=${encodeURIComponent(destination)}`;

  return (
    <main id="top" className="resonance-readable relative min-h-screen overflow-x-hidden text-[#f8f5ef]">
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
        <div className="resonance-photo-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 md:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <img
            src="/images/oremea-logo-wht.png"
            alt="Oremea"
            className="mx-auto h-16 w-auto md:h-24"
          />

          <p className="mt-8 text-sm uppercase tracking-[0.32em] text-[#e7c98b] md:text-base">
            Resonance by Oremea
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[0.98] tracking-tight md:text-6xl">
            Stay with what becomes visible.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-100 md:text-lg">
            Resonance is a private seven-stage reflection experience. Ten thematic
            rooms are available, and each visit opens one room to move through at your own pace.
          </p>
        </header>

        <section className="mx-auto mt-12 max-w-3xl rounded-[2rem] border border-white/15 bg-black/45 p-7 backdrop-blur-[2px] md:p-9">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-[#e7c98b]">
              Ten rooms · any order
            </p>
            <h2 className="mt-3 font-serif text-3xl text-white">
              Choose your visits, then choose a room.
            </h2>
            <p className="mt-4 text-sm text-zinc-100">
              One room active at a time.
            </p>
          </div>

          <p className="mx-auto mt-7 max-w-2xl text-center text-sm leading-7 text-zinc-100">
            {checkoutEnabled
              ? "The purchase step offers one, three, or four visits. Each unused visit stays available on the account until it is used to open a room. Room choice happens after payment, so the purchase is for Resonance visits rather than for a specific room."
              : "Choose the room that fits what is present now. Each purchase opens one fresh Resonance visit, while earlier completed visits remain preserved in the archive."}
          </p>

          <div className="mt-8 border-t border-white/15 pt-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-[#e7c98b]">
                How a room unfolds
              </p>
              <p className="mt-4 text-sm leading-7 text-zinc-100">
                Each room moves through seven guided reflection stages at your own pace.
              </p>
              <p className="mt-4 text-sm leading-7 text-zinc-100">
                Across the first six stages, the Mirror reflects what is becoming visible
                and offers two questions to take the reflection deeper.
              </p>
              <p className="mt-4 text-sm leading-7 text-zinc-100">
                The final stage brings the room together in a Closing Mirror, reflecting
                what persisted, shifted, sharpened, or became newly visible.
              </p>
            </div>
          </div>

          <p className="mx-auto mt-7 max-w-2xl text-center text-sm leading-7 text-zinc-200">
            Completed rooms remain in the Archive. A later visit can open a different
            room or return to one you have used before.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href={entryHref}
              className="inline-flex rounded-xl border border-[#e7c98b]/70 px-6 py-3 text-sm text-[#e7c98b] transition hover:bg-[#e7c98b]/10"
            >
              {checkoutEnabled
                ? userId
                  ? "Choose Resonance visits"
                  : "Create account and choose visits"
                : userId
                  ? "Choose a Resonance room"
                  : "Create account and choose a room"}
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-3xl space-y-4">
          <details className="rounded-2xl border border-white/15 bg-black/35 p-5">
            <summary className="cursor-pointer text-sm text-zinc-100">
              Returning to a room
            </summary>
            <p className="mt-4 text-sm leading-7 text-zinc-200">
              Each return creates a separate visit. Earlier reflections, Mirrors, the two
              questions from each stage, and Closing Mirrors remain intact. Once the newer
              visit closes, the two visits can be viewed side by side so differences in the
              participant&apos;s own language are visible without shaping the newer responses
              in advance.
            </p>
          </details>

          <details className="rounded-2xl border border-white/15 bg-black/35 p-5">
            <summary className="cursor-pointer text-sm text-zinc-100">
              The role of Mirror
            </summary>
            <p className="mt-4 text-sm leading-7 text-zinc-200">
              The Mirror reads each stage&apos;s participant-written reflections as one body
              of evidence, reflects what becomes visible across them, and offers two
              questions arising from that reflection. The Closing Mirror arrives after the
              final stage and reads across the full visit, including the participant&apos;s
              responses to those questions, while earlier generated material remains
              context rather than evidence about the participant.
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
