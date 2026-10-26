import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { SiteShell } from "@/components/site/site-shell";
import {
  getGoldenKeyInviteState,
  normalizeGoldenKeyEmail,
} from "@/lib/auth/golden-key-invites";

import { claimGoldenKeyAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Params = Promise<{ token: string }>;
type SearchParams = Promise<{ error?: string }>;

function maskedEmail(email: string) {
  const [local, domain] = email.split("@");
  const visible = local.length <= 1 ? "*" : `${local[0]}${"*".repeat(Math.min(6, local.length - 1))}`;
  return `${visible}@${domain}`;
}

function StatusCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#b79a63]/25 bg-black/50 p-7 md:p-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#b79a63]">{eyebrow}</p>
      <h1 className="mt-4 text-3xl font-light text-zinc-100 md:text-5xl">{title}</h1>
      <p className="mt-5 text-sm leading-7 text-zinc-400">{body}</p>
    </div>
  );
}

export default async function GoldenKeyClaimPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { token } = await params;
  const { error } = await searchParams;
  const invite = await getGoldenKeyInviteState(token);

  if (invite.status === "invalid") {
    return (
      <SiteShell>
        <section className="px-6 py-16 md:py-24">
          <StatusCard
            eyebrow="Golden Key"
            title="This link is not valid"
            body="Ask the person who issued the invitation to create a fresh Golden Key link."
          />
        </section>
      </SiteShell>
    );
  }

  if (invite.status === "claimed") {
    return (
      <SiteShell>
        <section className="px-6 py-16 md:py-24">
          <StatusCard
            eyebrow="Golden Key"
            title="Already claimed"
            body="This one-use invitation has already issued its ∞ All Access Golden Key."
          />
        </section>
      </SiteShell>
    );
  }

  if (invite.status === "revoked") {
    return (
      <SiteShell>
        <section className="px-6 py-16 md:py-24">
          <StatusCard
            eyebrow="Golden Key"
            title="This invitation was replaced"
            body="Only the newest Golden Key invitation for this email can be used. Ask for the latest link."
          />
        </section>
      </SiteShell>
    );
  }

  if (invite.status === "expired") {
    return (
      <SiteShell>
        <section className="px-6 py-16 md:py-24">
          <StatusCard
            eyebrow="Golden Key"
            title="This invitation has expired"
            body="The temporary invitation expired without affecting any Golden Key already issued. Ask for a fresh link."
          />
        </section>
      </SiteShell>
    );
  }

  const { userId } = await auth();
  const claimPath = `/key/claim/${token}`;
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(claimPath)}`;
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(claimPath)}`;
  let canClaim = false;

  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const verifiedEmails = user.emailAddresses
      .filter((email) => email.verification?.status === "verified")
      .map((email) => normalizeGoldenKeyEmail(email.emailAddress));
    canClaim = verifiedEmails.includes(invite.email);
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-2xl px-6 py-16 md:py-24">
        <div className="rounded-[2rem] border border-[#b79a63]/30 bg-black/55 p-7 shadow-[0_25px_90px_rgba(0,0,0,0.35)] md:p-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#b79a63]">Oremea Golden Key</p>
          <h1 className="mt-4 text-4xl font-light text-zinc-100 md:text-6xl">∞ All Access</h1>
          <p className="mt-5 text-sm leading-7 text-zinc-400">
            This is a one-use invitation for {maskedEmail(invite.email)}. Once claimed, the invitation ends and the Golden Key does not.
          </p>

          {error === "claim" ? (
            <p role="alert" className="mt-7 rounded-xl border border-[var(--oremea-danger-border)] bg-[var(--oremea-danger-panel)] px-5 py-4 text-sm leading-6 text-[var(--oremea-danger)]">
              The invitation could not be claimed. Confirm that it is still valid
              and that the invited address is verified on this account. If
              this continues, request a fresh invitation.
            </p>
          ) : null}

          {canClaim ? (
            <form action={claimGoldenKeyAction} className="mt-8">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full rounded-full border border-[#b79a63]/45 bg-[#b79a63]/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-[#e7c98b] transition hover:border-[#b79a63]/80 hover:bg-[#b79a63]/15"
              >
                Claim ∞ All Access
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-950/75 px-5 py-4 text-sm leading-6 text-zinc-300">
              <p>
                This invitation belongs to the verified email address it was issued
                to. A forwarded link cannot be claimed by someone else.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {userId ? (
                  <SignOutButton signOutOptions={{ redirectUrl: signInUrl }}>
                    <button
                      type="button"
                      className="rounded-full border border-[var(--oremea-gold-border-soft)] bg-[var(--oremea-gold-10)] px-5 py-3 text-xs uppercase tracking-[0.12em] text-[var(--oremea-gold)] transition hover:border-[var(--oremea-gold-border-strong)]"
                    >
                      Switch to invited account
                    </button>
                  </SignOutButton>
                ) : (
                  <>
                    <Link
                      href={signInUrl}
                      className="rounded-full border border-[var(--oremea-gold-border-soft)] bg-[var(--oremea-gold-10)] px-5 py-3 text-xs uppercase tracking-[0.12em] text-[var(--oremea-gold)] transition hover:border-[var(--oremea-gold-border-strong)]"
                    >
                      Sign in to claim
                    </Link>
                    <Link
                      href={signUpUrl}
                      className="rounded-full border border-[var(--oremea-border)] px-5 py-3 text-xs uppercase tracking-[0.12em] text-[var(--oremea-text-secondary)] transition hover:border-[var(--oremea-gold-border-soft)]"
                    >
                      Create an account
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          <p className="mt-6 text-xs leading-6 text-zinc-600">
            Invitation expires {invite.expiresAt.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}. A forwarded link cannot be claimed by a different verified email.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
