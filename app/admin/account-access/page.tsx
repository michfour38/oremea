import { SiteShell } from "@/components/site/site-shell";
import { ETERNAL_OREMEA_KEY } from "@/lib/auth/account-access";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

import {
  grantEternalKeyAction,
  restoreAccountAction,
  suspendAccountAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AccountAccessAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const done = typeof params.done === "string" ? params.done : null;
  const email = typeof params.email === "string" ? params.email : null;

  const [suspended, eternalKeys] = await Promise.all([
    prisma.account_security.findMany({
      where: { status: "suspended" },
      orderBy: { suspended_at: "desc" },
      take: 25,
    }),
    prisma.oremea_entitlements.findMany({
      where: {
        product_key: ETERNAL_OREMEA_KEY,
        status: "active",
        revoked_at: null,
        expires_at: null,
      },
      orderBy: { granted_at: "desc" },
      take: 25,
    }),
  ]);

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <p className="text-xs uppercase tracking-[0.26em] text-[#b79a63]">Oremea Admin</p>
        <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">Account access</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300">
          Security suspension is separate from purchases, credits and eternal-key entitlement. Restoring an account returns the access it already owned.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-[#b79a63]/30 bg-[#b79a63]/10 px-5 py-4 text-sm text-[#ead6a9]">
            {done === "key" ? "Eternal Oremea key granted" : done === "suspended" ? "Account suspended" : "Account restored"}
            {email ? ` · ${email}` : ""}
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <AdminForm
            title="Give eternal key"
            description="Permanent ∞ All Access. No expiry. A later security suspension does not remove it."
            action={grantEternalKeyAction}
            submit="Give key"
          />
          <AdminForm
            title="Suspend account"
            description="Immediately revoke sessions and prevent sign-in across protected Oremea surfaces."
            action={suspendAccountAction}
            submit="Suspend account"
            reason
            danger
          />
          <AdminForm
            title="Restore account"
            description="Allow sign-in again without rebuilding purchases, credits, history or entitlements."
            action={restoreAccountAction}
            submit="Restore account"
            reason
          />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <StateList
            title={`Suspended · ${suspended.length}`}
            empty="No suspended accounts in the latest set."
            rows={suspended.map((item) => ({
              key: item.user_id,
              primary: item.user_id,
              secondary: [item.suspended_source, item.suspended_reason].filter(Boolean).join(" · ") || "No reason recorded",
            }))}
          />
          <StateList
            title={`Eternal keys · ${eternalKeys.length}`}
            empty="No eternal keys have been granted yet."
            rows={eternalKeys.map((item) => ({
              key: item.id,
              primary: item.user_id,
              secondary: `Granted ${item.granted_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
            }))}
          />
        </div>
      </section>
    </SiteShell>
  );
}

function AdminForm({
  title,
  description,
  action,
  submit,
  reason = false,
  danger = false,
}: {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  submit: string;
  reason?: boolean;
  danger?: boolean;
}) {
  return (
    <form action={action} className="rounded-[2rem] border border-white/10 bg-black/40 p-6">
      <h2 className="text-xl font-light text-zinc-100">{title}</h2>
      <p className="mt-3 min-h-20 text-sm leading-6 text-zinc-500">{description}</p>
      <label className="mt-5 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        Member email
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm normal-case tracking-normal text-zinc-100 outline-none transition focus:border-[#b79a63]/60"
        />
      </label>
      {reason ? (
        <label className="mt-4 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Reason
          <input
            name="reason"
            type="text"
            maxLength={500}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm normal-case tracking-normal text-zinc-100 outline-none transition focus:border-[#b79a63]/60"
          />
        </label>
      ) : null}
      <button
        type="submit"
        className={`mt-6 w-full rounded-full border px-5 py-3 text-xs uppercase tracking-[0.18em] transition ${
          danger
            ? "border-red-500/35 bg-red-500/10 text-red-200 hover:border-red-400/70"
            : "border-[#b79a63]/35 bg-[#b79a63]/10 text-[#e7c98b] hover:border-[#b79a63]/70"
        }`}
      >
        {submit}
      </button>
    </form>
  );
}

function StateList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ key: string; primary: string; secondary: string }>;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
      <h2 className="text-lg font-light text-zinc-100">{title}</h2>
      <div className="mt-5 grid gap-3">
        {rows.length ? rows.map((row) => (
          <div key={row.key} className="rounded-xl border border-white/5 bg-zinc-950/80 px-4 py-3">
            <p className="break-all text-xs text-zinc-300">{row.primary}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-600">{row.secondary}</p>
          </div>
        )) : <p className="text-sm text-zinc-600">{empty}</p>}
      </div>
    </div>
  );
}
