import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { visitCheckoutAvailableFor } from "@/src/lib/resonance/visit-access";
import { visitCheckoutEnabled } from "@/src/lib/resonance/visit-offers";

// Keep this page as the single public Resonance funnel entry.
export default async function ResonanceEnterPage() {
  const { userId } = await auth();
  const checkoutEnabled = userId ? await visitCheckoutAvailableFor(userId) : false;
  const funnelCheckoutEnabled = checkoutEnabled || (!userId && visitCheckoutEnabled());
  const destination = funnelCheckoutEnabled ? "/resonance/visits" : "/entry";
  const entryHref = userId
    ? destination
    : `/sign-up?redirect_url=${encodeURIComponent(destination)}`;

  return (
    <main id="top" className="resonance-theme relative min-h-screen overflow-x-hidden">
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
        <div className="res-photo-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 md:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <img
            src="/images/oremea-logo-wht.png"
            alt="Oremea"
            className="mx-auto h-16 w-auto md:h-24"
          />

          <p className="res-accent mt-8 text-sm uppercase tracking-[0.32em] md:text-base">
            Resonance by Oremea
          </p>

          <h1 className="res-text mt-4 font-serif text-4xl font-semibold leading-[0.98] tracking-tight md:text-6xl">
            Stay with what becomes visible.
          </h1>

          <p className="res-text-primary mx-auto mt-6 max-w-2xl text-base leading-8 md:text-lg">
            Resonance is a private seven-stage reflection experience. Ten thematic
            rooms are available, and each visit opens one room to move through at your own pace.
          </p>
        </header>

        <section className="res-border res-panel mx-auto mt-12 max-w-3xl rounded-[2rem] border p-7 backdrop-blur-[2px] md:p-9">
          <div className="text-center">
            <p className="res-accent text-xs uppercase tracking-[0.28em]">
              Ten rooms · any order
            </p>
            <h2 className="res-text mt-3 font-serif text-3xl">
              Choose your visits, then choose a room.
            </h2>
            <p className="res-text-primary mt-4 text-sm">
              One room active at a time.
            </p>
          </div>

          <p className="res-text-primary mx-auto mt-7 max-w-2xl text-center text-sm leading-7">
            {funnelCheckoutEnabled
              ? "Choose one, three, or four visits. Each unused visit stays on your account until you use it to open a room. You choose the room after payment, so there is nothing else to decide before checkout."
              : "Choose the room that fits what is present now. Each purchase opens one fresh Resonance visit, while earlier completed visits remain preserved in the archive."}
          </p>

          <div className="mt-7 flex justify-center">
            <Link
              href={entryHref}
              className="res-action inline-flex rounded-xl border px-6 py-3 text-sm transition"
            >
              {funnelCheckoutEnabled
                ? userId
                  ? "Choose Resonance visits"
                  : "Create account and choose visits"
                : userId
                  ? "Choose a Resonance room"
                  : "Create account and choose a room"}
            </Link>
          </div>

          <p className="res-text-secondary mx-auto mt-5 max-w-2xl text-center text-sm leading-7">
            Completed rooms remain in the Archive. A later visit can open a different
            room or return to one you have used before.
          </p>

          <details className="res-divider mt-8 border-t pt-6">
            <summary className="res-text-primary cursor-pointer text-center text-sm">
              What happens inside a room?
            </summary>
            <div className="mx-auto mt-5 max-w-2xl text-center">
              <p className="res-text-primary text-sm leading-7">
                Each room moves through seven guided reflection stages at your own pace.
              </p>
              <p className="res-text-primary mt-4 text-sm leading-7">
                Across the first six stages, the Mirror reflects what is becoming visible
                and offers two questions to take the reflection deeper.
              </p>
              <p className="res-text-primary mt-4 text-sm leading-7">
                The final stage brings the room together in a Closing Mirror, reflecting
                what persisted, shifted, sharpened, or became newly visible.
              </p>
            </div>
          </details>
        </section>

        <section className="mx-auto mt-8 max-w-3xl space-y-4">
          <details className="res-border res-panel rounded-2xl border p-5">
            <summary className="res-text-primary cursor-pointer text-sm">
              Returning to a room
            </summary>
            <p className="res-text-secondary mt-4 text-sm leading-7">
              Each return creates a separate visit. Earlier reflections, Mirrors, the two
              questions from each stage, and Closing Mirrors remain intact. Once the newer
              visit closes, the two visits can be viewed side by side so differences in the
              participant&apos;s own language are visible without shaping the newer responses
              in advance.
            </p>
          </details>

          <details className="res-border res-panel rounded-2xl border p-5">
            <summary className="res-text-primary cursor-pointer text-sm">
              The role of Mirror
            </summary>
            <p className="res-text-secondary mt-4 text-sm leading-7">
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
