import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { RESONANCE_ROOM_MARKETING } from "@/src/lib/oremea/public-product-marketing";
import { RESONANCE_ROOM_NAMES } from "@/src/lib/resonance/room-entry";
import { visitCheckoutAvailableFor } from "@/src/lib/resonance/visit-access";
import { visitCheckoutEnabled } from "@/src/lib/resonance/visit-offers";
import { getVisitBalance } from "@/src/lib/resonance/visit-orders";

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
        ? "See Resonance visit options"
        : signedIn
          ? "Enter Resonance"
          : "Explore Resonance"}
    </Link>
  );
}

export default async function ResonanceEnterPage() {
  const { userId } = await auth();
  const checkoutEnabled = userId
    ? await visitCheckoutAvailableFor(userId)
    : visitCheckoutEnabled();
  const hasUnusedVisits = Boolean(userId && (await getVisitBalance(userId)) > 0);
  const funnelCheckoutEnabled = checkoutEnabled;
  const entryHref = hasUnusedVisits
    ? "/entry"
    : checkoutEnabled
      ? "/resonance/visits"
      : userId
        ? "/entry"
        : "/resonance/enter";

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
            Stay with what becomes visible
          </h1>

          <p className="res-text-primary mx-auto mt-6 max-w-2xl text-base leading-8 md:text-lg">
            Resonance is a private seven-stage reflection experience for relational
            material that needs more than one quick answer. Ten thematic rooms hold
            different territories of connection, and every visit gives one room enough
            space to move through at your own pace
          </p>

          <div className="mt-8 flex justify-center">
            <FunnelAction
              href={entryHref}
              signedIn={Boolean(userId)}
              checkoutReady={funnelCheckoutEnabled}
            />
          </div>

          <p className="res-text-secondary mx-auto mt-4 max-w-xl text-sm leading-7">
            Visit capacity stays available until it is used. One room is active at a time
          </p>
        </header>

        <section className="res-border res-panel mx-auto mt-16 max-w-4xl rounded-[2rem] border p-7 backdrop-blur-[2px] md:p-10">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">
            Why Resonance exists
          </p>
          <h2 className="res-text mt-3 max-w-2xl font-serif text-3xl md:text-4xl">
            Some things become clearer only when they are allowed to stay present
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
              Structure without being pushed toward an answer
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
            The visit comes first · The room opens when the material is ready
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              [
                "1 · Choose visit capacity",
                funnelCheckoutEnabled
                  ? "Start with one, three, or four visits. If a room caught your attention first, Resonance remembers that interest without locking it in."
                  : "Start with the room that fits what is present now. Each purchase opens one fresh Resonance visit.",
              ],
              [
                "2 · Complete payment",
                "Payment comes before account creation. Once the purchase is confirmed, you can accept or skip the one-time Complete Ten offer.",
              ],
              [
                "3 · Keep the visits in your account",
                "After payment and the optional offer, create or sign into the Oremea account that uses the checkout email. The purchased visits attach there.",
              ],
              [
                "4 · Choose the room to enter",
                "If you showed interest in a room earlier, it is brought back as a reminder only. You can begin there or compare the rooms and choose another starting point.",
              ],
              [
                "5 · Move through seven stages",
                "Each room moves through seven guided reflection stages at your own pace. Across the first six stages, the Mirror reflects what is becoming visible and offers two questions arising from that reflection.",
              ],
              [
                "6 · Keep the completed visit",
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
              Ten relational territories · Start where the material is alive
            </h2>
            <p className="res-text-primary mt-5 text-base leading-8">
              Each room stands on its own. A later visit can enter a different territory or
              return to one already completed without altering the earlier visit.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {RESONANCE_ROOM_MARKETING.map((room) => {
              const roomName = RESONANCE_ROOM_NAMES[room.weekNumber];
              const roomHref = funnelCheckoutEnabled
                ? `/resonance/visits?room=${room.weekNumber}`
                : `/entry?room=${room.weekNumber}`;
              return (
                <details key={room.id} className="res-border res-panel group rounded-3xl border backdrop-blur-[2px]">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-5 px-6 py-5 md:px-7">
                    <div>
                      <p className="res-accent text-xs uppercase tracking-[0.2em]">Room {room.weekNumber} · {roomName}</p>
                      <h3 className="res-text mt-3 font-serif text-2xl">{room.headline.replace(/\.$/, "")}</h3>
                      <p className="res-text-secondary mt-3 text-sm leading-7">{room.buyerDecision}</p>
                    </div>
                    <span className="res-accent mt-1 shrink-0 transition group-open:rotate-180">↓</span>
                  </summary>
                  <div className="res-divider border-t px-6 py-6 md:px-7">
                    <div className="max-w-3xl">
                      <p className="res-text-primary text-sm leading-7">{room.description}</p>
                      <p className="res-text-secondary mt-4 text-sm leading-7"><span className="res-accent font-medium">Enter this room when:</span>{" "}{room.chooseWhen}</p>
                    </div>
                    <Link href={roomHref} className="res-action mt-6 inline-flex rounded-xl border px-5 py-2.5 text-sm font-medium transition">Choose {roomName} →</Link>
                    {funnelCheckoutEnabled ? (
                      <p className="res-text-secondary mt-3 text-xs leading-6">We&apos;ll remember the interest through checkout. You can choose a different room before opening a visit.</p>
                    ) : null}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="res-border res-panel mx-auto mt-20 max-w-4xl rounded-[2rem] border p-7 md:p-10">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">
            The Mirror
          </p>
          <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">
            Reflection stays close to the evidence you actually provide
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
              The earlier visit stays intact
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
              Reflection is not a verdict
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
              The practical bits
            </h2>
          </div>

          <div className="mt-8 space-y-4">
            {[
              [
                "Do I need to select a room before buying visits?",
                funnelCheckoutEnabled
                  ? "No. If a room catches your attention first, Resonance remembers that interest through checkout, but it does not reserve or lock the room. After purchase you can begin there or choose another room."
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
            Start with the visit capacity that fits · Open the room when the material is ready
          </h2>
          <p className="res-text-primary mx-auto mt-5 max-w-2xl text-sm leading-7">
            Completed rooms remain in the Archive. Unused visits remain available until they
            are used to open a room
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
