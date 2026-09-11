import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { PartyInviteControls } from "./invite-controls";
import { registerForParty } from "./actions";

const EVENT_KEY = "what-keeps-repeating-in-connection-1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_GUEST_INVITATIONS = 2;

export const metadata: Metadata = {
  title: "What Keeps Repeating in Connection? | Oremea",
  description:
    "A free live Oremea session for looking more closely at patterns that can remain familiar even when the people and circumstances change.",
};

export const dynamic = "force-dynamic";

function ticketCode(id: string) {
  return `ORE-${id.split("-")[0].toUpperCase()}`;
}

export default async function PartyPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; registered?: string; error?: string }>;
}) {
  const query = await searchParams;
  const startLabel = process.env.OREMEA_PARTY_START_LABEL?.trim() || null;
  const joinUrl = process.env.OREMEA_PARTY_JOIN_URL?.trim() || null;
  const origin = (
    process.env.NEXT_PUBLIC_OREMEA_PARTY_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://www.oremea.com"
  ).replace(/\/$/, "");

  const registeredId =
    query.registered && UUID_PATTERN.test(query.registered) ? query.registered : null;
  const registration = registeredId
    ? await prisma.oremea_party_registrations.findFirst({
        where: { id: registeredId, event_key: EVENT_KEY },
      })
    : null;

  const referralCode = registration?.referral_code ?? "";
  const inviteUrl = referralCode
    ? `${origin}/party?ref=${encodeURIComponent(referralCode)}`
    : "";

  const usedGuestInvitations = registration
    ? await prisma.oremea_party_registrations.count({
        where: {
          event_key: EVENT_KEY,
          invited_by: registration.referral_code,
        },
      })
    : 0;
  const remainingInvites = Math.max(
    0,
    MAX_GUEST_INVITATIONS - usedGuestInvitations,
  );

  const incomingReferral =
    query.ref && UUID_PATTERN.test(query.ref) ? query.ref : null;
  const inviter = incomingReferral
    ? await prisma.oremea_party_registrations.findFirst({
        where: {
          event_key: EVENT_KEY,
          referral_code: incomingReferral,
        },
        select: { referral_code: true },
      })
    : null;
  const inviterUses = inviter
    ? await prisma.oremea_party_registrations.count({
        where: {
          event_key: EVENT_KEY,
          invited_by: inviter.referral_code,
        },
      })
    : 0;
  const incomingInvitationAvailable =
    Boolean(inviter) && inviterUses < MAX_GUEST_INVITATIONS;

  return (
    <main className="min-h-screen bg-[#080704] text-white">
      <SiteNav />

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.24em] text-[#c8a96a]">
            Free live Oremea session
          </p>
          <h1 className="mt-5 font-serif text-4xl font-light leading-tight md:text-6xl">
            What Keeps Repeating in Connection?
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            A live conversation for looking more closely at relational patterns that can
            remain strangely familiar even when the people, circumstances, and stories change.
          </p>
          <p className="mt-4 text-lg leading-8 text-zinc-300">
            Private reflection. Live teaching. No requirement to disclose personal details publicly.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 text-base text-[#f1dfb4]">
            <span className="rounded-full border border-[#c8a96a]/30 px-4 py-2">Free admission</span>
            <span className="rounded-full border border-[#c8a96a]/30 px-4 py-2">Live online</span>
            <span className="rounded-full border border-[#c8a96a]/30 px-4 py-2">
              {startLabel || "Date + access details by email"}
            </span>
          </div>
        </div>

        {registration ? (
          <section className="mt-12 max-w-3xl">
            <div className="overflow-hidden rounded-[2rem] border border-[#c8a96a]/45 bg-[#15120c]">
              <div className="border-b border-[#c8a96a]/20 px-7 py-6 md:px-9">
                <p className="text-sm uppercase tracking-[0.22em] text-[#c8a96a]">
                  Your place is reserved
                </p>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl">
                  Your Oremea live-session ticket
                </h2>
              </div>

              <div className="grid gap-6 px-7 py-7 md:grid-cols-[1fr_auto] md:px-9">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                    What Keeps Repeating in Connection?
                  </p>
                  <p className="mt-3 text-2xl text-[#f1dfb4]">{ticketCode(registration.id)}</p>
                  <p className="mt-4 text-lg leading-8 text-zinc-300">
                    {startLabel || "Live date, time, and access details will be sent to the registration email."}
                  </p>
                </div>
                <div className="min-w-40 rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Admission</p>
                  <p className="mt-2 text-3xl font-light">1</p>
                  <p className="mt-4 text-base text-zinc-300">Live online</p>
                  <p className="mt-1 text-base text-zinc-400">Free</p>
                </div>
              </div>

              <div className="border-t border-white/10 px-7 py-6 md:px-9">
                <p className="text-lg leading-8 text-zinc-300">
                  Keep this page or the confirmation email. The ticket is the confirmation that the place is reserved.
                </p>
                {joinUrl ? (
                  <a
                    href={joinUrl}
                    className="mt-5 inline-flex rounded-full border border-[#c8a96a]/55 bg-[#c8a96a]/10 px-6 py-3 text-base text-[#f1dfb4]"
                  >
                    Join the live session
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 md:p-9">
              <p className="text-sm uppercase tracking-[0.22em] text-[#c8a96a]">
                Included with this ticket
              </p>
              <h2 className="mt-3 font-serif text-3xl">Two guest invitations</h2>
              <p className="mt-4 text-lg leading-8 text-zinc-300">
                If two people come immediately to mind who would genuinely use this conversation,
                send them an invitation. Each person reserves their own place.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[0, 1].map((index) => {
                  const used = index < usedGuestInvitations;
                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-black/25 p-5"
                    >
                      <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                        Guest invitation {index + 1}
                      </p>
                      <p className="mt-2 text-xl text-zinc-100">
                        {used ? "Used" : "Available"}
                      </p>
                    </div>
                  );
                })}
              </div>

              <PartyInviteControls
                inviteUrl={inviteUrl}
                remainingInvites={remainingInvites}
              />
            </div>

            <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/25 p-7 md:p-9">
              <h2 className="font-serif text-2xl">What happens next</h2>
              <div className="mt-5 grid gap-4 text-lg leading-8 text-zinc-300 md:grid-cols-3">
                <p><span className="text-[#c8a96a]">1.</span> Keep the ticket email.</p>
                <p><span className="text-[#c8a96a]">2.</span> Live access details arrive by email.</p>
                <p><span className="text-[#c8a96a]">3.</span> Join without needing to share personal details publicly.</p>
              </div>
            </div>
          </section>
        ) : (
          <form
            action={registerForParty}
            className="mt-12 max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 md:p-9"
          >
            <h2 className="font-serif text-3xl">Reserve a place</h2>
            <p className="mt-3 text-lg leading-8 text-zinc-300">
              Registration asks one useful question so part of the live session can be shaped around what participants are actually carrying.
            </p>

            {incomingReferral ? (
              <div className="mt-5 rounded-2xl border border-[#c8a96a]/25 bg-[#c8a96a]/5 p-5">
                <p className="text-lg text-[#f1dfb4]">
                  {incomingInvitationAvailable
                    ? "A guest invitation brought this page here."
                    : "That guest invitation has already been used twice. A free place can still be reserved normally."}
                </p>
              </div>
            ) : null}

            {query.error ? (
              <p role="alert" className="mt-5 rounded-xl border border-amber-200/20 bg-amber-100/5 p-4 text-base text-amber-100">
                Add a valid email address and the question or relational theme taking up the most space right now.
              </p>
            ) : null}

            <input
              type="hidden"
              name="invitedBy"
              value={incomingInvitationAvailable ? incomingReferral ?? "" : ""}
            />

            <label className="mt-7 block text-base text-zinc-200">
              First name
              <input
                name="firstName"
                maxLength={120}
                autoComplete="given-name"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-lg text-white outline-none focus:border-[#c8a96a]/60"
              />
            </label>

            <label className="mt-5 block text-base text-zinc-200">
              Email
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-lg text-white outline-none focus:border-[#c8a96a]/60"
              />
            </label>

            <label className="mt-5 block text-base leading-7 text-zinc-200">
              What relationship question, recurring pattern, or relational theme is taking up the most space right now?
              <textarea
                name="question"
                required
                maxLength={3000}
                rows={5}
                className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-lg text-white outline-none focus:border-[#c8a96a]/60"
              />
            </label>

            <button
              type="submit"
              className="mt-7 w-full rounded-full border border-[#c8a96a]/60 bg-[#c8a96a]/10 px-6 py-3 text-lg text-[#f1dfb4] transition hover:bg-[#c8a96a]/15"
            >
              Reserve my free place
            </button>
          </form>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
