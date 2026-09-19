import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminPage();

  const [newFeedback, openFeedback, totalFeedback] = await Promise.all([
    prisma.oremea_feedback_messages.count({ where: { status: "new" } }),
    prisma.oremea_feedback_messages.count({
      where: { status: { in: ["new", "in_progress"] } },
    }),
    prisma.oremea_feedback_messages.count(),
  ]);

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <p className="text-xs uppercase tracking-[0.26em] text-[#b79a63]">
          Oremea Admin
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
          Business lives here.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300">
          Private operational tools for Oremea. This area is restricted to
          admin accounts and is not part of the public site.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
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
                  Read quick feedback and completion surveys, add internal
                  notes, and mark each item handled.
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
              Provision and verify the hidden Whop visit product, fixed-price
              plans and webhook before public checkout is enabled.
            </p>
          </Link>

          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              Admin foundation
            </p>
            <h2 className="mt-3 text-2xl font-light text-zinc-200">
              More business tools can live here
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              The admin shell is now separate from customer navigation, so
              registrations, reviews, product operations and reporting can be
              added here without exposing them publicly.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
