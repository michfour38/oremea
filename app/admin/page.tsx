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

  const now = new Date();

  const [
    newFeedback,
    openFeedback,
    totalFeedback,
    goldenKeys,
    goldenInvites,
    goldenInviteHistory,
    silverKeys,
    silverInvites,
    silverInviteHistory,
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
    prisma.oremea_eternal_key_invites.findMany({
      where: {
        claimed_at: null,
        revoked_at: null,
        expires_at: { gt: now },
      },
      orderBy: { created_at: "desc" },
      take: 25,
      select: {
        id: true,
        email_normalized: true,
        created_at: true,
        expires_at: true,
        claimed_at: true,
        revoked_at: true,
      },
    }),
    prisma.oremea_eternal_key_invites.findMany({
      where: {
        OR: [
          { claimed_at: { not: null } },
          { revoked_at: { not: null } },
          { expires_at: { lte: now } },
        ],
      },
      orderBy: { created_at: "desc" },
      take: 25,
      select: {
        id: true,
        email_normalized: true,
        created_at: true,
        expires_at: true,
        claimed_at: true,
        revoked_at: true,
      },
    }),
    prisma.oremea_creator_silver_key_issuances.findMany({
      where: { revoked_at: null },
      orderBy: { granted_at: "desc" },
      take: 25,
    }),
    prisma.oremea_creator_silver_key_invites.findMany({
      where: {
        claimed_at: null,
        revoked_at: null,
        expires_at: { gt: now },
      },
      orderBy: { created_at: "desc" },
      take: 25,
      select: {
        id: true,
        email_normalized: true,
        created_at: true,
        expires_at: true,
        claimed_at: true,
        revoked_at: true,
      },
    }),
    prisma.oremea_creator_silver_key_invites.findMany({
      where: {
        OR: [
          { claimed_at: { not: null } },
          { revoked_at: { not: null } },
          { expires_at: { lte: now } },
        ],
      },
      orderBy: { created_at: "desc" },
      take: 25,
      select: {
        id: true,
        email_normalized: true,
        created_at: true,
        expires_at: true,
        claimed_at: true,
        revoked_at: true,
      },
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
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--oremea-gold)]">
          Oremea Admin
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
          Business lives here.
        </h1>
        <a href="https://dawn.oremea.com/?view=Operations" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center rounded-xl border border-[var(--oremea-gold-border-soft)] px-5 py-3 text-sm font-medium text-[var(--oremea-text-primary)] transition hover:border-[var(--oremea-gold)]">DAWN Control Room ↗</a>
        <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300">
          Private operational tools for Oremea. Golden Key is permanent ∞ All Access. Creator Silver Key is finite experience access: three Resonance room credits plus independent 30-day Recognition and Compass windows that begin only when each product is first entered.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-[var(--oremea-gold-border-soft)] bg-[var(--oremea-gold-10)] px-5 py-4 text-sm text-[var(--oremea-text-primary)]">
            {done === "key"
              ? "Golden Key granted"
              : done === "suspended"
                ? "Account suspended"
                : "Account restored"}
            {email ? ` · ${email}` : ""}
          </div>
        ) : null}

        <div className="mt-12">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--oremea-gold)]">
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

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <StateList
              title={`Golden invitations · ${goldenInvites.length} awaiting claim`}
              empty="No active Golden Key invitations are awaiting claim."
              rows={goldenInvites.map((item) => ({
                key: item.id,
                primary: item.email_normalized,
                secondary: [
                  "Awaiting claim · not proof of delivery",
                  `Created ${item.created_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
                  `Expires ${item.expires_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
                ].join(" · "),
              }))}
              historyRows={goldenInviteHistory.map((item) => ({
                key: item.id,
                primary: item.email_normalized,
                secondary: [
                  item.claimed_at
                    ? "Claimed"
                    : item.revoked_at
                      ? "Replaced"
                      : "Expired · create a new link",
                  `Created ${item.created_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
                  item.claimed_at
                    ? `Claimed ${item.claimed_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`
                    : item.revoked_at
                      ? `Replaced ${item.revoked_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`
                      : `Expired ${item.expires_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
                ].join(" · "),
              }))}
            />
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
              title={`Silver invitations · ${silverInvites.length} awaiting claim`}
              empty="No active Creator Silver Key invitations are awaiting claim."
              rows={silverInvites.map((item) => ({
                key: item.id,
                primary: item.email_normalized,
                secondary: [
                  "Awaiting claim · not proof of delivery",
                  `Created ${item.created_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
                  `Expires ${item.expires_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
                ].join(" · "),
              }))}
              historyRows={silverInviteHistory.map((item) => ({
                key: item.id,
                primary: item.email_normalized,
                secondary: [
                  item.claimed_at
                    ? "Claimed"
                    : item.revoked_at
                      ? "Replaced"
                      : "Expired · issue a fresh link",
                  `Created ${item.created_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
                  item.claimed_at
                    ? `Claimed ${item.claimed_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`
                    : item.revoked_at
                      ? `Replaced ${item.revoked_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`
                      : `Expired ${item.expires_at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
                ].join(" · "),
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

          <div className="mt-10 border-t border-[var(--oremea-danger-border)] pt-8">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--oremea-danger)]">
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
              className="group rounded-[2rem] border border-[var(--oremea-gold-border-soft)] bg-black/45 p-7 transition hover:border-[var(--oremea-gold-border-strong)]"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--oremea-gold)]">
                    Feedback
                  </p>
                  <h2 className="mt-3 text-2xl font-light text-zinc-100">
                    Private inbox
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    Read quick feedback and completion surveys, add internal notes, and mark each item handled.
                  </p>
                </div>
                <span className="rounded-full border border-[var(--oremea-gold-border-soft)] bg-[var(--oremea-gold-10)] px-3 py-1 text-sm text-[var(--oremea-gold)]">
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
              className="group rounded-[2rem] border border-[var(--oremea-gold-border-soft)] bg-black/45 p-7 transition hover:border-[var(--oremea-gold-border-strong)]"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--oremea-gold)]">
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
    <form action={action} className="oremea-admin-surface rounded-[2rem] border p-6">
      <h2 className="text-xl font-light text-zinc-100">{title}</h2>
      <p className="mt-3 min-h-20 text-sm leading-6 text-zinc-500">{description}</p>
      <label className="mt-5 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        Member email
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          className="oremea-admin-field mt-2 w-full rounded-xl px-4 py-3 text-sm normal-case tracking-normal"
        />
      </label>
      {reason ? (
        <label className="mt-4 block text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Reason
          <input
            name="reason"
            type="text"
            maxLength={500}
            className="oremea-admin-field mt-2 w-full rounded-xl px-4 py-3 text-sm normal-case tracking-normal"
          />
        </label>
      ) : null}
      <button
        type="submit"
        className={`mt-6 w-full rounded-full border px-5 py-3 text-xs uppercase tracking-[0.18em] transition ${
          danger
            ? "oremea-admin-action-danger"
            : "oremea-admin-action"
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
  historyRows,
}: {
  title: string;
  empty: string;
  rows: Array<{ key: string; primary: string; secondary: string }>;
  historyRows?: Array<{ key: string; primary: string; secondary: string }>;
}) {
  const listContent = (
    <>
      <div className="mt-5 grid gap-3">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-[var(--oremea-border)] bg-[var(--oremea-panel-strong)] px-4 py-3"
            >
              <p className="break-all text-xs text-[var(--oremea-text-primary)]">{row.primary}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--oremea-zinc-500)]">{row.secondary}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--oremea-text-secondary)]">{empty}</p>
        )}
      </div>
      {historyRows ? (
        <details className="group/history mt-5 border-t border-[var(--oremea-border)] pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2 text-xs tracking-wide text-[var(--oremea-gold)] transition hover:text-[var(--oremea-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--oremea-gold)] [&::-webkit-details-marker]:hidden">
            <span>Invitation history · {historyRows.length} recent (claimed, replaced, expired)</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 shrink-0 transition-transform group-open/history:rotate-180"
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="mt-3 grid gap-3">
            {historyRows.length ? (
              historyRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-xl border border-[var(--oremea-border)] bg-[var(--oremea-panel-strong)] px-4 py-3"
                >
                  <p className="break-all text-xs text-[var(--oremea-text-primary)]">{row.primary}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--oremea-zinc-500)]">{row.secondary}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--oremea-text-secondary)]">No previous invitations yet.</p>
            )}
          </div>
        </details>
      ) : null}
    </>
  );

  if (historyRows) {
    return (
      <details className="oremea-admin-surface group/invites rounded-[2rem] border p-6">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-[var(--oremea-text-primary)] transition hover:text-[var(--oremea-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--oremea-gold)] [&::-webkit-details-marker]:hidden">
          <span className="text-lg font-light">{title}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5 shrink-0 text-[var(--oremea-gold)] transition-transform group-open/invites:rotate-180"
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        {listContent}
      </details>
    );
  }

  return (
    <div className="oremea-admin-surface rounded-[2rem] border p-6">
      <h2 className="text-lg font-light text-[var(--oremea-text-primary)]">{title}</h2>
      {listContent}
    </div>
  );
}
