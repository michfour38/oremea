import { clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";

import { CreatorSilverKeyInviteForm } from "@/components/admin/creator-silver-key-invite-form";
import { DeleteAccountForm } from "@/components/admin/delete-account-form";
import { GoldenKeyInviteForm } from "@/components/admin/golden-key-invite-form";
import { SiteShell } from "@/components/site/site-shell";
import { ETERNAL_OREMEA_KEY } from "@/lib/auth/account-access";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

import {
  restoreAccountAction,
  suspendAccountAction,
} from "./account-access/actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function silverWindowLabel(
  label: string,
  activatedAt: Date | null,
  expiresAt: Date | null,
) {
  if (!activatedAt || !expiresAt) return `${label}: not started`;
  return `${label}: ${activatedAt.toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg" })} → ${expiresAt.toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg" })}`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const done = typeof params.done === "string" ? params.done : null;
  const email = typeof params.email === "string" ? params.email : null;

  const [
    newFeedback,
    openFeedback,
    totalFeedback,
    goldenKeys,
    silverKeys,
    suspended,
  ] = await Promise.all([
    prisma.oremea_feedback_messages.count({ where: { status: "new" } }),
    prisma.oremea_feedback_messages.count({
      where: { status: { in: ["new", "in_progress"] } },
    }),
    prisma.oremea_feedback_messages.count(),
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
    prisma.oremea_creator_silver_key_issuances.findMany({
      where: { revoked_at: null },
      orderBy: { granted_at: "desc" },
      take: 25,
    }),
    prisma.account_security.findMany({
      where: { status: "suspended" },
      orderBy: { suspended_at: "desc" },
      take: 25,
    }),
  ]);

  const userIds = Array.from(
    new Set([
      ...goldenKeys.map((item) => item.user_id),
      ...suspended.map((item) => item.user_id),
    ]),
  );
  const emailByUserId = new Map<string, string>();

  if (userIds.length) {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    });

    for (const user of users) {
      emailByUserId.set(
        user.id,
        user.primaryEmailAddress?.emailAddress ?? user.id,
      );
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <p className="text-xs uppercase tracking-[0.26em] text-[#b79a63]">
          Oremea Admin
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
          Business lives here.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300">
          Private operational tools for Oremea. Golden Key is permanent ∞ All Access. Creator Silver Key is finite experience access: three Resonance room credits plus independent 30-day Recognition and Compass windows that begin only when each product is first entered.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-[#b79a63]/30 bg-[#b79a63]/10 px-5 py-4 text-sm text-[#ead6a9]">
            {done === "key"
              ? "Golden Key granted"
              : done === "suspended"
                ? "Account suspended"
                : "Account restored"}
            {email ? ` · ${email}` : ""}
          </div>
        ) : null}

        <div className="mt-12">
          <p className="text-xs uppercase tracking-[0.22em] text-[#b79a63]">
            Identity + security
          </p>
          <h2 className="mt-3 text-3xl font-light text-zinc-100">
            Keys and account access
          </h2>

          <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            <GoldenKeyInviteForm />
            <CreatorSilverKeyInviteForm />
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

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <StateList
              title={`Golden Keys · ${goldenKeys.length}`}
              empty="No Golden Keys have been granted yet."
              rows={goldenKeys.map((item) => ({
                key: item.id,
                primary: emailByUserId.get(item.user_id) ?? item.user_id,
                secondary: `Granted ${item.granted_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })} · ${
                  item.source === "eternal_key_issuance" && item.source_reference
                    ? "Identity protected"
                    : "Legacy identity pending"
                }`,
              }))}
            />
            <StateList
              title={`Creator Silver Keys · ${silverKeys.length}`}
              empty="No Creator Silver Keys have been claimed yet."
              rows={silverKeys.map((item) => ({
                key: item.id,
                primary: item.email_normalized,
                secondary: [
                  item.current_user_id ? "Claimed" : "Not attached",
                  silverWindowLabel(
                    "Recognition",
                    item.recognition_activated_at,
                    item.recognition_expires_at,
                  ),
                  silverWindowLabel(
                    "Compass",
                    item.compass_activated_at,
                    item.compass_expires_at,
                  ),
                  item.resonance_order_id ? "Resonance: 3-credit grant created" : "Resonance: grant missing",
                ].join(" · "),
              }))}
            />
            <StateList
              title={`Suspended · ${suspended.length}`}
              empty="No suspended accounts in the latest set."
              rows={suspended.map((item) => ({
                key: item.user_id,
                primary: emailByUserId.get(item.user_id) ?? item.user_id,
                secondary:
                  [item.suspended_source, item.suspended_reason]
                    .filter(Boolean)
                    .join(" · ") || "No reason recorded",
              }))}
            />
          </div>

          <div className="mt-10 border-t border-red-500/15 pt-8">
            <p className="text-xs uppercase tracking-[0.22em] text-red-300/60">
              Danger zone
            </p>
            <div className="mt-5 max-w-2xl">
              <DeleteAccountForm />
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-10">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            Operations
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <Link
              href="/admin/feedback"
              className="group rounded-[2rem] border border-[#b79a63]/25 bg-black/45 p-7 transition hover:border-[#b79a63]/55"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#b79a63]">
                    Feedback
                  </p>
                  <h2 className="mt-3 text-2xl font-light text-zinc-100">
                    Private inbox
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    Read quick feedback and completion surveys, add internal notes, and mark each item handled.
                  </p>
                </div>
                <span className="rounded-full border border-[#b79a63]/30 bg-[#b79a63]/10 px-3 py-1 text-sm text-[#e1c68e]">
                  {newFeedback} new
                </span>
              </div>
              <div className="mt-6 flex gap-5 border-t border-white/10 pt-5 text-xs text-zinc-500">
                <span>{openFeedback} open</span>
                <span>{totalFeedback} total</span>
              </div>
            </Link>

            <Link
              href="/admin/resonance-commerce"
              className="group rounded-[2rem] border border-[#b79a63]/25 bg-black/45 p-7 transition hover:border-[#b79a63]/55"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[#b79a63]">
                Resonance
              </p>
              <h2 className="mt-3 text-2xl font-light text-zinc-100">
                Visit-credit commerce
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Provision and verify the hidden Whop visit product, fixed-price plans and webhook before public checkout is enabled.
              </p>
            </Link>

            <Link
              href="/admin/affiliates"
              className="rounded-[2rem] border border-white/10 bg-black/35 p-7"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                Affiliates
              </p>
              <h2 className="mt-3 text-2xl font-light text-zinc-200">
                Creator and affiliate management
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-500">
                Review commission policy, owner approval steps and measured Whop economics.
              </p>
            </Link>
          </div>
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
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-white/5 bg-zinc-950/80 px-4 py-3"
            >
              <p className="break-all text-xs text-zinc-300">{row.primary}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">{row.secondary}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-600">{empty}</p>
        )}
      </div>
    </div>
  );
}
