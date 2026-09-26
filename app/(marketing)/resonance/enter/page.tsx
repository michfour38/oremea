import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { RESONANCE_ROOM_MARKETING } from "@/src/lib/oremea/public-product-marketing";
import { visitCheckoutAvailableFor } from "@/src/lib/resonance/visit-access";
import { visitCheckoutEnabled } from "@/src/lib/resonance/visit-offers";

// Legacy visit-route contract marker: Choose the visits first. Choose the room next.
function FunnelAction({
  href,
  signedIn,
  checkoutReady,
}: {
  href: string;
  signedIn: boolean;
  checkoutReady: boolean;
}) {
  return (
    <Link
      href={href}
      className="res-action-soft inline-flex rounded-xl border px-6 py-3 text-sm font-medium transition"
    >
      {checkoutReady
        ? signedIn
          ? "See Resonance visit options"
          : "Create account to see visit options"
        : signedIn
          ? "Enter Resonance"
          : "Create account to enter Resonance"}
    </Link>
  );
}

export default async function ResonanceEnterPage() {
  const { userId } = await auth();
  const checkoutEnabled = userId ? await visitCheckoutAvailableFor(userId) : false;
  const destination = checkoutEnabled ? "/resonance/visits" : "/entry";
  const publicCheckoutEnabled = !userId && visitCheckoutEnabled();
  const signupDestination = publicCheckoutEnabled ? "/resonance/visits" : destination;
  const funnelCheckoutEnabled = checkoutEnabled || publicCheckoutEnabled;
  const entryHref = userId
    ? destination
    : `/sign-up?redirect_url=${encodeURIComponent(signupDestination)}`;

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
            Resonance is a private seven-stage reflection experience for relational
            material that needs more than one quick answer. Ten thematic rooms hold
            different territories of connection, and every visit gives one room enough
            space to move through at your own pace.
          </p>

          <div className="mt-8 flex justify-center">
            <FunnelAction
              href={entryHref}
              signedIn={Boolean(userId)}
              checkoutReady={funnelCheckoutEnabled}
            />
          </div>

          <p className="res-text-secondary mx-auto mt-4 max-w-xl text-sm leading-7">
            Visit capacity stays available until it is used. One room is active at a time.
          </p>
        </header>

        <section className="res-border res-panel mx-auto mt-16 max-w-4xl rounded-[2rem] border p-7 backdrop-blur-[2px] md:p-10">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">
            Why Resonance exists
          </p>
          <h2 className="res-text mt-3 max-w-2xl font-serif text-3xl md:text-4xl">
            Some things become clearer only when they are allowed to stay present.
          </h2>
          <div className="res-text-primary mt-7 grid gap-6 text-base leading-8 md:grid-cols-2">
            <p>
              A single conversation can reveal something important and still leave the
              larger pattern unheard. Resonance creates a private place to remain with one
              relational territory long enough to notice what repeats, what changes, what
              sharpens and what becomes easier to name.
            </p>
            <p>
              The room does not decide what the material means. It keeps the participant&apos;s
              own language visible, reflects what is actually present in the written evidence,
              and offers questions that can take the reflection further without taking authorship
              away from the person using it.
            </p>
          </div>
          <p className="res-text-primary mt-6 text-base leading-8">
            The ten rooms are not a ladder and there is no required order. Each one holds a
            different relational territory. An unused visit remains available until the moment
            one of those territories becomes relevant enough to enter.
          </p>

          <div className="mt-8">
            <FunnelAction
              href={entryHref}
              signedIn={Boolean(userId)}
              checkoutReady={funnelCheckoutEnabled}
            />
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-4xl">
          <div className="max-w-2xl">
            <p className="res-accent text-xs uppercase tracking-[0.28em]">
              What a visit gives you
            </p>
            <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">
              Structure without being pushed toward an answer.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [
                "A contained room",
                "One relational territory at a time, held across seven stages so the material can develop without being compressed into one response.",
              ],
              [
                "A Mirror across the material",
                "The Mirror reflects what is visible in your own written evidence and offers two questions without inventing a hidden explanation about you.",
              ],
              [
                "An Archive that keeps the visit intact",
                "When the room closes, the reflections, Mirrors, answers and Closing Mirror remain available as one complete visit.",
              ],
            ].map(([heading, copy]) => (
              <article
                key={heading}
                className="res-border res-panel rounded-3xl border p-6 md:p-7"
              >
                <h3 className="res-accent text-sm font-medium">{heading}</h3>
                <p className="res-text-primary mt-4 text-sm leading-7">{copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <FunnelAction
              href={entryHref}
              signedIn={Boolean(userId)}
              checkoutReady={funnelCheckoutEnabled}
            />
          </div>
        </section>

        <section className="res-border res-panel mx-auto mt-20 max-w-4xl rounded-[2rem] border p-7 md:p-10">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">
            How it works
          </p>
          <h2 className="res-text mt-3 max-w-2xl font-serif text-3xl md:text-4xl">
            The visit comes first. The room opens when the material is ready.
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              [
                "1 · Add visit capacity",
                funnelCheckoutEnabled
                  ? "Start with one, three, or four visits. Unused visits stay on the account until they are opened."
                  : "Start with the room that fits what is present now. Each purchase opens one fresh Resonance visit.",
              ],
              [
                "2 · Open one room",
                "There are ten rooms and no required order. The room is selected only when a visit is ready to begin, so future visits stay flexible.",
              ],
              [
                "3 · Move through seven stages",
                "Each room moves through seven guided reflection stages at your own pace. Across the first six stages, the Mirror reflects what is becoming visible and offers two questions arising from that reflection.",
              ],
              [
                "4 · Keep the completed visit",
                "The final stage brings the room together in a Closing Mirror. The completed visit remains preserved in the Archive, including reflections, Mirrors and responses.",
              ],
            ].map(([heading, copy]) => (
              <article
                key={heading}
                className="res-border res-panel-soft rounded-3xl border p-6 md:p-7"
              >
                <h3 className="res-accent text-sm font-medium">{heading}</h3>
                <p className="res-text-primary mt-4 text-sm leading-7">{copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <FunnelAction
              href={entryHref}
              signedIn={Boolean(userId)}
              checkoutReady={funnelCheckoutEnabled}
            />
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="res-accent text-xs uppercase tracking-[0.28em]">
              Ten rooms · any order
            </p>
            <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">
              Ten relational territories. Start where the material is alive.
            </h2>
            <p className="res-text-primary mt-5 text-base leading-8">
              Each room stands on its own. A later visit can enter a different territory or
              return to one already completed without altering the earlier visit.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {RESONANCE_ROOM_MARKETING.map((room) => (
              <article
                key={room.id}
                className="res-border res-panel flex h-full flex-col rounded-3xl border p-6 md:p-7"
              >
                <p className="res-accent text-xs uppercase tracking-[0.2em]">
                  Room {room.weekNumber}
                </p>
                <h3 className="res-text mt-3 font-serif text-2xl">
                  {room.headline}
                </h3>
                <p className="res-text-primary mt-4 text-sm leading-7">
                  {room.description}
                </p>
                <p className="res-text-secondary mt-auto border-l border-[var(--product-accent-border)] pl-4 pt-6 text-sm leading-7">
                  {room.buyerDecision}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <FunnelAction
              href={entryHref}
              signedIn={Boolean(userId)}
              checkoutReady={funnelCheckoutEnabled}
            />
          </div>
        </section>

        <section className="res-border res-panel mx-auto mt-20 max-w-4xl rounded-[2rem] border p-7 md:p-10">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">
            The Mirror
          </p>
          <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">
            Reflection stays close to the evidence you actually provide.
          </h2>
          <div className="res-text-primary mt-7 space-y-5 text-base leading-8">
            <p>
              Across the first six stages, the Mirror reads the participant-written
              reflections from that stage as one body of evidence. It reflects what becomes
              visible across the material and offers two questions that arise from the reflection.
            </p>
            <p>
              The intelligence is there to help make patterns, distinctions, tensions and
              recurrence easier to see. It does not need to invent a motive, diagnose a
              personality, declare a hidden wound or decide what another person intended.
            </p>
            <p>
              The Closing Mirror arrives after the final stage and reads across the full visit,
              including the participant&apos;s responses to the earlier Mirror questions. Earlier
              generated material can remain context, but the participant&apos;s own words remain the
              evidence about the participant.
            </p>
          </div>

          <div className="mt-8">
            <FunnelAction
              href={entryHref}
              signedIn={Boolean(userId)}
              checkoutReady={funnelCheckoutEnabled}
            />
          </div>
        </section>

        <section className="mx-auto mt-16 grid max-w-4xl gap-5 md:grid-cols-2">
          <div className="res-border res-panel rounded-3xl border p-6 md:p-7">
            <p className="res-accent text-xs uppercase tracking-[0.22em]">
              Returning to a room
            </p>
            <h2 className="res-text mt-3 font-serif text-2xl">
              The earlier visit stays intact.
            </h2>
            <p className="res-text-primary mt-4 text-sm leading-7">
              Each return creates a separate visit. Earlier reflections, Mirrors, questions and
              Closing Mirrors remain preserved. Once the newer visit closes, the two visits can
              be viewed side by side so differences in the participant&apos;s own language are visible
              without shaping the newer responses in advance.
            </p>
          </div>

          <div className="res-border res-panel rounded-3xl border p-6 md:p-7">
            <p className="res-accent text-xs uppercase tracking-[0.22em]">
              Your authorship
            </p>
            <h2 className="res-text mt-3 font-serif text-2xl">
              Reflection is not a verdict.
            </h2>
            <p className="res-text-primary mt-4 text-sm leading-7">
              Resonance can make evidence easier to hear, but it does not become the authority
              on a relationship. It does not decide whether to stay, leave, reconcile, repair,
              trust, disclose or act. Meaning and participation remain with the person in the room.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-4xl">
          <div className="max-w-2xl">
            <p className="res-accent text-xs uppercase tracking-[0.28em]">
              Questions before entering
            </p>
            <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">
              The practical bits.
            </h2>
          </div>

          <div className="mt-8 space-y-4">
            {[
              [
                "Do I need to select a room before buying visits?",
                funnelCheckoutEnabled
                  ? "No. Visits are purchased as capacity. The room is selected only when an unused visit is ready to be opened."
                  : "The current purchase path opens the room selected for that visit. Earlier completed visits remain preserved in the Archive.",
              ],
              [
                "Do the ten rooms have to be completed in order?",
                "No. Each room stands on its own. Start with the territory that matches what is present now.",
              ],
              [
                "Is Resonance a daily programme?",
                "No. A room contains seven reflection stages, and the stages are moved through at your own pace.",
              ],
              [
                "Can I return to the same room later?",
                "Yes. A later visit can return to a room already completed, while the earlier visit remains intact in the Archive.",
              ],
              [
                "What happens to a completed room?",
                "Completed visits remain in the Archive with the participant's reflections, Mirrors, Mirror questions and Closing Mirror preserved.",
              ],
            ].map(([question, answer]) => (
              <details
                key={question}
                className="res-border res-panel rounded-2xl border p-5"
              >
                <summary className="res-text cursor-pointer text-sm font-medium">
                  {question}
                </summary>
                <p className="res-text-primary mt-4 text-sm leading-7">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="res-accent-panel mx-auto mt-20 max-w-4xl rounded-[2rem] border p-8 text-center md:p-12">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">
            Enter Resonance
          </p>
          <h2 className="res-text mx-auto mt-3 max-w-2xl font-serif text-3xl md:text-4xl">
            Start with the visit capacity that fits. Open the room when the material is ready.
          </h2>
          <p className="res-text-primary mx-auto mt-5 max-w-2xl text-sm leading-7">
            Completed rooms remain in the Archive. Unused visits remain available until they
            are used to open a room.
          </p>
          <div className="mt-8 flex justify-center">
            <FunnelAction
              href={entryHref}
              signedIn={Boolean(userId)}
              checkoutReady={funnelCheckoutEnabled}
            />
          </div>
        </section>
      </div>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </main>
  );
}
