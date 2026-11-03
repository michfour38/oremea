import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminPage } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import {
  getCurrentApprovedPartnerAppearance,
} from "@/src/lib/oremea/partner-appearance-release-server";
import {
  isKnownPartner,
  parsePartnerAppearanceDraft,
  referencedPartnerImageFiles,
} from "@/src/lib/oremea/partner-appearance-contract";
import { partnerAppearanceReleaseEnabled } from "@/src/lib/oremea/partner-appearance-release-contract";
import { getPublishedPartnerExperience } from "@/src/lib/oremea/partner-experiences";
import { approvePartnerAppearance, withdrawPartnerAppearance } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Approve partner appearance | OREMEA Admin",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

/** Real publication review requires OREMEA admin, never partner editor access. */
export default async function PartnerAppearanceReview({ params }: Props) {
  await requireAdminPage();
  const { slug } = await params;
  if (!isKnownPartner(slug)) notFound();
  const [draft, published, history] = await Promise.all([
    prisma.oremea_partner_appearances.findUnique({
      where: { partner_slug: slug },
      select: { revision: true, draft: true, updated_at: true, updated_by: true },
    }),
    getCurrentApprovedPartnerAppearance(slug),
    prisma.oremea_partner_appearance_approval_history.findMany({
      where: { partner_slug: slug },
      orderBy: { created_at: "desc" },
      take: 12,
      select: { id: true, action: true, actor_id: true, approval_version: true, created_at: true },
    }),
  ]);
  const appearance = draft ? parsePartnerAppearanceDraft(draft.draft, slug) : null;
  const images = appearance ? referencedPartnerImageFiles(appearance) : [];
  const enabled = partnerAppearanceReleaseEnabled();
  const commerciallyPublished = Boolean(getPublishedPartnerExperience(slug));
  const live = Boolean(enabled && commerciallyPublished && published?.isActive);

  return (
    <main className="min-h-screen bg-[#0b0b0b] p-6 text-white md:p-12">
      <div className="mx-auto max-w-4xl space-y-7">
        <Link href="/admin/partner-appearance" className="text-sm underline">
          Back to appearance editor
        </Link>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Admin approval only</p>
          <h1 className="text-3xl font-light">Review {slug} appearance</h1>
          <p className="text-sm leading-7 text-zinc-300">
            Approval freezes a specific saved revision and creates metadata-stripped
            public image copies. Only a separate release configuration and a
            verified published partner can activate it for customers.
          </p>
        </div>
        <div className="grid gap-4 rounded-xl border border-white/15 p-5 text-sm md:grid-cols-2">
          <p>Saved draft: {draft ? `revision ${draft.revision}` : "none"}</p>
          <p>Approved snapshot: {published ? `v${published.approvalVersion}` : "none"}</p>
          <p>Approval state: {published?.isActive ? "approved" : "not approved"}</p>
          <p>Customer appearance: {live ? "release conditions met" : "NOT LIVE"}</p>
          <p>Release feature: {enabled ? "enabled" : "disabled"}</p>
          <p>Published partner checkout: {commerciallyPublished ? "verified" : "unavailable"}</p>
        </div>
        {appearance ? (
          <section className="space-y-4 rounded-xl border border-white/15 p-5">
            <h2 className="text-xl">Saved version to review</h2>
            <div className="flex flex-wrap gap-3">
              {([
                ["Background", appearance.background],
                ["Text", appearance.foreground],
                ["Accent", appearance.accent],
              ] as const).map(([label, color]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm">
                  <span aria-hidden="true" className="inline-block h-5 w-5 rounded border border-white/40" style={{ backgroundColor: color }} />
                  {label}: {color}
                </span>
              ))}
            </div>
            <p>Resonance scenery: {appearance.resonanceScenes.mode}</p>
            <p>Images referenced: {images.length}</p>
            <p className="text-xs text-zinc-300">
              Review the imagery in the private studio before approving. Images
              are re-encoded to WebP without embedded metadata. Original uploads remain private.
            </p>
            <Link className="inline-block text-sm underline" href={`/partner/studio/${slug}`}>
              Inspect saved scenes
            </Link>
            <form action={approvePartnerAppearance} className="space-y-3">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="draftRevision" value={draft!.revision} />
              <input type="hidden" name="approvalVersion" value={published?.approvalVersion ?? 0} />
              <button type="submit" className="rounded-lg border border-amber-400 bg-amber-400/15 px-5 py-3 text-sm font-medium">
                Approve saved revision {draft!.revision}
              </button>
            </form>
          </section>
        ) : <p className="text-sm text-zinc-400">There is no saved draft to approve yet.</p>}
        {published?.isActive && (
          <form action={withdrawPartnerAppearance} className="space-y-2 rounded-xl border border-white/15 p-5">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="draftRevision" value={draft?.revision ?? 0} />
            <input type="hidden" name="approvalVersion" value={published.approvalVersion} />
            <button type="submit" className="rounded-lg border border-red-400/60 px-5 py-3 text-sm">
              Withdraw approval (restore base OREMEA theme)
            </button>
          </form>
        )}
        <section className="space-y-3">
          <h2 className="text-xl">Approval history</h2>
          {history.length === 0 && <p className="text-sm text-zinc-400">No approvals or withdrawals recorded.</p>}
          {history.map(item => (
            <p key={item.id} className="border-b border-white/10 py-2 text-xs text-zinc-300">
              {item.action} · v{item.approval_version} · {item.created_at.toISOString()} · {item.actor_id}
            </p>
          ))}
        </section>
      </div>
    </main>
  );
}
