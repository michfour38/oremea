import type { Metadata } from "next";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { SiteShell } from "@/components/site/site-shell";
import {
  getCreatorSilverKeyInviteState,
  normalizeCreatorSilverEmail,
} from "@/lib/auth/creator-silver-key-invites";

import { claimCreatorSilverKeyAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Params = Promise<{ token: string }>;

function maskedEmail(email: string) {
  const [local, domain] = email.split("@");
  const visible =
    local.length <= 1
      ? "*"
      : `${local[0]}${"*".repeat(Math.min(6, local.length - 1))}`;
  return `${visible}@${domain}`;
}

function StatusCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-zinc-300/20 bg-black/50 p-7 md:p-10">
      <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-300">
        Creator Silver Key
      </p>
      <h1 className="mt-4 text-3xl font-light text-zinc-100 md:text-5xl">
        {title}
      </h1>
      <p className="mt-5 text-sm leading-7 text-zinc-400">{body}</p>
    </div>
  );
}

export default async function CreatorSilverKeyClaimPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const invite = await getCreatorSilverKeyInviteState(token);

  if (invite.status === "invalid") {
    return (
      <SiteShell>
        <section className="px-6 py-16 md:py-24">
          <StatusCard
            title="This link is not valid"
            body="Ask the person who issued the invitation to create a fresh Creator Silver Key link."
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
            title="Already claimed"
            body="This one-use invitation has already issued its Creator Silver Key."
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
            title="This invitation was replaced"
            body="Only the newest Creator Silver Key invitation for this email can be used. Ask for the latest link."
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
            title="This invitation has expired"
            body="The one-use invitation expires after seven days. Ask for a fresh Creator Silver Key link."
          />
        </section>
      </SiteShell>
    );
  }

  const { userId } = await auth();
  let canClaim = false;

  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const verifiedEmails = user.emailAddresses
      .filter((email) => email.verification?.status === "verified")
      .map((email) => normalizeCreatorSilverEmail(email.emailAddress));
    canClaim = verifiedEmails.includes(invite.email);
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-2xl px-6 py-16 md:py-24">
        <div className="rounded-[2rem] border border-zinc-300/25 bg-black/55 p-7 shadow-[0_25px_90px_rgba(0,0,0,0.35)] md:p-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-300">
            Oremea Creator Silver Key
          </p>
          <h1 className="mt-4 text-4xl font-light text-zinc-100 md:text-6xl">
            Experience Oremea first
          </h1>
          <p className="mt-5 text-sm leading-7 text-zinc-400">
            This is a one-use invitation for {maskedEmail(invite.email)}. It opens
            30 days of Recognition, three Resonance room credits, and 30 days of
            Compass. Recognition and Compass start separately when you first enter
            each product.
          </p>

          {canClaim ? (
            <form action={claimCreatorSilverKeyAction} className="mt-8">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full rounded-full border border-zinc-300/35 bg-zinc-200/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-zinc-100 transition hover:border-zinc-200/70 hover:bg-zinc-200/15"
              >
                Claim Creator Silver Key
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-950/75 px-5 py-4 text-sm leading-6 text-zinc-400">
              Sign in with the verified email address this Creator Silver Key was
              issued to. A forwarded link cannot be claimed by another account.
            </div>
          )}

          <p className="mt-6 text-xs leading-6 text-zinc-600">
            Invitation expires{" "}
            {invite.expiresAt.toLocaleString("en-ZA", {
              timeZone: "Africa/Johannesburg",
            })}
            .
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
