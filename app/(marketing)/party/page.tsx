import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { PartyInviteControls } from "./invite-controls";
import { registerForParty } from "./actions";

const EVENT_KEY = "what-keeps-repeating-in-connection-1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    (registration?.invite_allowance ?? 0) - usedGuestInvitations,
  );

  const incomingReferral =
    query.ref && UUID_PATTERN.test(query.ref) ? query.ref : null;
  const inviter = incomingReferral
    ? await prisma.oremea_party_registrations.findFirst({
        where: {
          event_key: EVENT_KEY,
          referral_code: incomingReferral,
        },
        select: { referral_code: true, invite_allowance: true },
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
    Boolean(inviter) && inviterUses < (inviter?.invite_allowance ?? 0);

  return (
    <main className="min-h-screen bg-[#080704] text-white">
      <SiteNav />

      <section className="mx-auto max-w-5xl px-6 py-20 md:px-8 md:py-28">
        <div className="max-w-2xl">
          <p className="text-base uppercase tracking-[0.2em] text-[#d9bb7b]">
            Free live Oremea session
          </p>
          <h1 className="mt-6 font-serif text-4xl font-light leading-[1.08] md:text-6xl">
            What Keeps Repeating in Connection?
          </h1>
          <p className="mt-7 max-w-2xl text-xl leading-9 text-zinc-200">
            A live conversation for looking more closely at relational patterns that can
            remain strangely familiar even when the people, circumstances, and stories change.
          </p>
          <p className="mt-5 max-w-2xl text-xl leading-9 text-zinc-200">
            Private reflection. Live teaching. No requirement to disclose personal details publicly.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 text-lg text-[#f1dfb4]">
            <span className="rounded-full border border-[#c8a96a]/35 bg-[#c8a96a]/[0.04] px-5 py-2.5">Free admission</span>
            <span className="rounded-full border border-[#c8a96a]/35 bg-[#c8a96a]/[0.04] px-5 py-2.5">Live online</span>
            <span className="rounded-full border border-[#c8a96a]/35 bg-[#c8a96a]/[0.04] px-5 py-2.5">
              {startLabel || "Date + access details by email"}
            </span>
          </div>
        </div>

        {registration ? (
          <section className="mt-16 max-w-3xl">
            <div className="overflow-hidden rounded-[2rem] border border-[#c8a96a]/45 bg-[#15120c]">
              <div className="border-b border-[#c8a96a]/20 px-7 py-6 md:px-9">
                <p className="text-base uppercase tracking-[0.2em] text-[#d9bb7b]">
                  Your place is reserved
                </p>
                <h2 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
                  Your Oremea live-session ticket
                </h2>
              </div>

              <div className="grid gap-6 px-7 py-7 md:grid-cols-[1fr_auto] md:px-9">
                <div>
                  <p className="text-base uppercase tracking-[0.18em] text-zinc-400">
                    What Keeps Repeating in Connection?
                  </p>
                  <p className="mt-3 text-2xl text-[#f1dfb4]">{ticketCode(registration.id)}</p>
                  <p className="mt-5 max-w-2xl text-xl leading-9 text-zinc-200">
                    {startLabel || "Live date, time, and access details will be sent to the registration email."}
                  </p>
                </div>
                <div className="min-w-40 rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-base uppercase tracking-[0.16em] text-zinc-400">Admission</p>
                  <p className="mt-2 text-3xl font-light">1</p>
                  <p className="mt-5 text-lg text-zinc-200">Live online</p>
                  <p className="mt-2 text-lg text-zinc-300">Free</p>
                </div>
              </div>

              <div className="border-t border-white/10 px-7 py-6 md:px-9">
                <p className="text-xl leading-9 text-zinc-200">
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

            {registration.invite_allowance > 0 ? (
              <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 md:p-9">
                <p className="text-base uppercase tracking-[0.2em] text-[#d9bb7b]">
                  Included with this ticket
                </p>
                <h2 className="mt-4 font-serif text-3xl leading-tight">Two guest invitations</h2>
                <p className="mt-5 max-w-2xl text-xl leading-9 text-zinc-200">
                  If two people come immediately to mind who would genuinely use this conversation,
                  send them an invitation. Each person reserves their own place.
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {[0, 1].map((index) => {
                    const unlocked = index < registration.invite_allowance;
                    const used = unlocked && index < usedGuestInvitations;
                    return (
                      <div
                        key={index}
                        className="rounded-2xl border border-white/15 bg-black/30 p-6"
                      >
                        <p className="text-base uppercase tracking-[0.16em] text-zinc-400">
                          Guest invitation {index + 1}
                        </p>
                        <p className="mt-3 text-2xl text-zinc-100">
                          {used ? "Used" : unlocked ? "Available" : "Locked"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <PartyInviteControls
                  inviteUrl={inviteUrl}
                  funnelUrl={`${origin}/resonance/visits`}
                  remainingInvites={remainingInvites}
                />
              </div>
            ) : null}

            <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/25 p-7 md:p-9">
              <h2 className="font-serif text-2xl">What happens next</h2>
              <div className="mt-6 grid gap-5 text-lg leading-8 text-zinc-200 md:grid-cols-3">
                <p><span className="text-[#c8a96a]">1.</span> Keep the ticket email.</p>
                <p><span className="text-[#c8a96a]">2.</span> Live access details arrive by email.</p>
                <p><span className="text-[#c8a96a]">3.</span> Join without needing to share personal details publicly.</p>
              </div>
            </div>
          </section>
        ) : (
          <form
            action={registerForParty}
            className="mt-16 max-w-xl rounded-[2rem] border border-white/15 bg-white/[0.035] p-8 shadow-2xl shadow-black/20 md:p-10"
          >
            <h2 className="font-serif text-4xl leading-tight">Reserve a place</h2>
            <p className="mt-5 text-lg leading-8 text-zinc-200">
              Registration asks one useful question so part of the live session can be shaped around what participants are actually carrying.
            </p>

            {incomingReferral ? (
              <div className="mt-7 rounded-2xl border border-[#c8a96a]/30 bg-[#c8a96a]/[0.06] p-6">
                <p className="text-lg text-[#f1dfb4]">
                  {incomingInvitationAvailable
                    ? "You’re here with a guest invitation."
                    : "That invitation is no longer available. A free place can still be reserved here."}
                </p>
              </div>
            ) : null}

            {query.error ? (
              <p role="alert" className="mt-7 rounded-2xl border border-amber-200/25 bg-amber-100/[0.06] p-5 text-lg leading-7 text-amber-50">
                Add a valid email address and the question or relational theme taking up the most space right now.
              </p>
            ) : null}

            <input
              type="hidden"
              name="invitedBy"
              value={incomingInvitationAvailable ? incomingReferral ?? "" : ""}
            />

            <label className="mt-9 block text-lg font-medium text-zinc-100">
              First name
              <input
                name="firstName"
                maxLength={120}
                autoComplete="given-name"
                className="mt-3 w-full rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-xl text-white outline-none transition focus:border-[#c8a96a]/70 focus:ring-1 focus:ring-[#c8a96a]/35"
              />
            </label>

            <label className="mt-7 block text-lg font-medium text-zinc-100">
              Email
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                className="mt-3 w-full rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-xl text-white outline-none transition focus:border-[#c8a96a]/70 focus:ring-1 focus:ring-[#c8a96a]/35"
              />
            </label>

            <label className="mt-7 block text-lg font-medium leading-8 text-zinc-100">
              What relationship question, recurring pattern, or relational theme is taking up the most space right now?
              <textarea
                name="question"
                required
                maxLength={3000}
                rows={6}
                className="mt-3 w-full resize-y rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-xl leading-8 text-white outline-none transition focus:border-[#c8a96a]/70 focus:ring-1 focus:ring-[#c8a96a]/35"
              />
            </label>

            <button
              type="submit"
              className="mt-10 w-full rounded-full border border-[#c8a96a]/70 bg-[#c8a96a]/15 px-6 py-4 text-xl font-medium text-[#f6e8c5] transition hover:bg-[#c8a96a]/20 focus:outline-none focus:ring-2 focus:ring-[#c8a96a]/50"
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
