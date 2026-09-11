import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { PartyInviteControls } from "./invite-controls";
import { PartyTopicSurvey } from "./topic-survey";
import { registerForParty } from "./actions";

export const metadata: Metadata = {
  title: "What Keeps Repeating in Connection? | Oremea",
  description:
    "A free live Oremea session for looking more closely at patterns that can remain familiar even when the people and circumstances change.",
};

export const dynamic = "force-dynamic";

export default async function PartyPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; registered?: string; error?: string }>;
}) {
  const query = await searchParams;
  const startLabel = process.env.OREMEA_PARTY_START_LABEL?.trim() || null;
  const origin =
    process.env.NEXT_PUBLIC_OREMEA_PARTY_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://www.oremea.com";

  const referralCode = query.registered?.trim() || "";
  const inviteUrl = referralCode
    ? `${origin.replace(/\/$/, "")}/party?ref=${encodeURIComponent(referralCode)}`
    : "";

  return (
    <main className="min-h-screen bg-[#080704] text-white">
      <SiteNav />

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8a96a]">
            Free live Oremea session
          </p>
          <h1 className="mt-5 font-serif text-4xl font-light leading-tight md:text-6xl">
            What Keeps Repeating in Connection?
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            A live conversation for looking more closely at relational patterns that can
            remain strangely familiar even when the people, circumstances, and stories change.
          </p>
          <p className="mt-4 text-base leading-8 text-zinc-400">
            Private reflection. Live teaching. No requirement to disclose personal details publicly.
          </p>

          {startLabel ? (
            <p className="mt-6 text-sm uppercase tracking-[0.18em] text-[#f1dfb4]">
              {startLabel}
            </p>
          ) : null}
        </div>

        {referralCode ? (
          <section className="mt-12 max-w-2xl rounded-[2rem] border border-[#c8a96a]/30 bg-[#15120c] p-7 md:p-9">
            <p className="text-xs uppercase tracking-[0.24em] text-[#c8a96a]">
              Place reserved
            </p>
            <h2 className="mt-3 font-serif text-3xl">Two guest invitations are available.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              If two people come immediately to mind who would genuinely use this conversation,
              send them an invitation. Each person registers for their own place.
            </p>
            <PartyInviteControls inviteUrl={inviteUrl} />
            <p className="mt-7 text-sm leading-7 text-zinc-500">
              Session details will be sent using the registration information supplied.
            </p>
          </section>
        ) : (
          <form
            action={registerForParty}
            className="mt-12 max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 md:p-9"
          >
            <h2 className="font-serif text-3xl">Reserve a place</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              A few quick choices help shape what needs attention in the live session without asking for anyone's whole story.
            </p>

            {query.error ? (
              <p role="alert" className="mt-5 rounded-xl border border-amber-200/20 bg-amber-100/5 p-4 text-sm text-amber-100">
                Add a valid email address and choose the topic that comes closest to what has your attention right now.
              </p>
            ) : null}

            <input type="hidden" name="invitedBy" value={query.ref?.trim() || ""} />

            <label className="mt-7 block text-sm text-zinc-200">
              First name
              <input
                name="firstName"
                maxLength={120}
                autoComplete="given-name"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none focus:border-[#c8a96a]/60"
              />
            </label>

            <label className="mt-5 block text-sm text-zinc-200">
              Email
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none focus:border-[#c8a96a]/60"
              />
            </label>

            <PartyTopicSurvey />

            <button
              type="submit"
              className="mt-7 w-full rounded-full border border-[#c8a96a]/60 bg-[#c8a96a]/10 px-6 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/15"
            >
              Reserve my place
            </button>
          </form>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
