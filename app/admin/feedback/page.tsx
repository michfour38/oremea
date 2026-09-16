import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth/require-admin";

import { updateFeedbackMessage } from "./actions";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "in_progress", "handled", "archived"] as const;

function statusLabel(status: string) {
  if (status === "in_progress") return "In progress";
  if (status === "handled") return "Handled";
  if (status === "archived") return "Archived";
  return "New";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(value);
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#b79a63]">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
        {value}
      </p>
    </div>
  );
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  await requireAdminPage();
  const query = await searchParams;
  const status = STATUSES.includes(query.status as (typeof STATUSES)[number])
    ? query.status
    : undefined;
  const type =
    query.type === "contact" || query.type === "completion"
      ? query.type
      : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(type ? { category: type } : {}),
  };

  const [messages, newCount, inProgressCount, handledCount, archivedCount] =
    await Promise.all([
      prisma.oremea_feedback_messages.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: 100,
      }),
      prisma.oremea_feedback_messages.count({ where: { status: "new" } }),
      prisma.oremea_feedback_messages.count({
        where: { status: "in_progress" },
      }),
      prisma.oremea_feedback_messages.count({ where: { status: "handled" } }),
      prisma.oremea_feedback_messages.count({ where: { status: "archived" } }),
    ]);

  const filters = [
    { href: "/admin/feedback", label: "All" },
    { href: "/admin/feedback?status=new", label: `New · ${newCount}` },
    {
      href: "/admin/feedback?status=in_progress",
      label: `In progress · ${inProgressCount}`,
    },
    {
      href: "/admin/feedback?status=handled",
      label: `Handled · ${handledCount}`,
    },
    {
      href: "/admin/feedback?status=archived",
      label: `Archived · ${archivedCount}`,
    },
  ];

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-xs uppercase tracking-[0.22em] text-[#b79a63] hover:text-[#e7c98b]"
            >
              ← Oremea Admin
            </Link>
            <h1 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">
              Feedback inbox
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Quick feedback and private completion surveys are stored here
              directly. Nothing in this inbox is public.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/feedback?type=contact"
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:border-[#b79a63]/50"
            >
              Quick feedback
            </Link>
            <Link
              href="/admin/feedback?type=completion"
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:border-[#b79a63]/50"
            >
              Completion surveys
            </Link>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Feedback status">
          {filters.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-zinc-300 transition hover:border-[#b79a63]/50 hover:text-[#e7c98b]"
            >
              {filter.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 space-y-5">
          {messages.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8 text-sm text-zinc-400">
              Nothing in this view yet.
            </div>
          ) : (
            messages.map((item) => (
              <article
                key={item.id}
                className="rounded-[2rem] border border-white/10 bg-black/50 p-6 shadow-xl shadow-black/20 md:p-7"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#b79a63]/35 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#d7bd86]">
                        {item.category === "completion"
                          ? "Completion survey"
                          : "Quick feedback"}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                        {statusLabel(item.status)}
                      </span>
                      {item.reply_requested ? (
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                          Reply requested
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-lg text-zinc-100">
                      {item.name || "Anonymous"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDate(item.created_at)}
                      {item.product && item.product !== "Oremea generally"
                        ? ` · ${item.product}`
                        : ""}
                    </p>
                  </div>

                  {item.email ? (
                    <a
                      href={`mailto:${item.email}`}
                      className="text-sm text-[#d7bd86] underline decoration-[#b79a63]/30 underline-offset-4"
                    >
                      {item.email}
                    </a>
                  ) : null}
                </div>

                <div className="mt-7 grid gap-6">
                  <TextBlock label="Message" value={item.message} />

                  {item.category === "completion" ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            Clarity before
                          </p>
                          <p className="mt-2 text-xl text-zinc-100">
                            {item.before_clarity}/5
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            Clarity after
                          </p>
                          <p className="mt-2 text-xl text-zinc-100">
                            {item.after_clarity}/5
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            Did what they came for
                          </p>
                          <p className="mt-2 text-xl text-zinc-100">
                            {item.fit_score}/5
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            Recommend
                          </p>
                          <p className="mt-2 text-xl text-zinc-100">
                            {item.recommend_score}/10
                          </p>
                        </div>
                      </div>

                      <TextBlock
                        label="What changed"
                        value={item.what_changed}
                      />
                      <TextBlock
                        label="Most useful"
                        value={item.most_useful}
                      />
                      <TextBlock
                        label="What could work better"
                        value={item.improvement}
                      />
                      <TextBlock
                        label="Anything else"
                        value={item.anything_else}
                      />
                    </>
                  ) : null}

                  {item.source ? (
                    <p className="text-xs leading-5 text-zinc-600">
                      Source: {item.source}
                    </p>
                  ) : null}
                </div>

                <form
                  action={updateFeedbackMessage}
                  className="mt-7 rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <div className="grid gap-4 md:grid-cols-[190px_1fr_auto] md:items-end">
                    <label className="text-xs text-zinc-400">
                      Status
                      <select
                        name="status"
                        defaultValue={item.status}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-zinc-200 outline-none focus:border-[#b79a63]/60"
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In progress</option>
                        <option value="handled">Handled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>

                    <label className="text-xs text-zinc-400">
                      Private admin note
                      <textarea
                        name="adminNote"
                        defaultValue={item.admin_note || ""}
                        rows={2}
                        maxLength={5000}
                        placeholder="What was done, what still needs attention, or anything useful to remember."
                        className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#b79a63]/60"
                      />
                    </label>

                    <button
                      type="submit"
                      className="rounded-full border border-[#b79a63]/45 bg-[#b79a63]/10 px-5 py-3 text-sm text-[#e2c78e] transition hover:border-[#b79a63]/75"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </article>
            ))
          )}
        </div>
      </section>
    </SiteShell>
  );
}
