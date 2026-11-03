import Link from "next/link";

import { requireAdminPage } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { OREMEA_PARTNER_EXPERIENCES } from "@/src/lib/oremea/partner-experiences";
import { grantPartnerAppearanceEditor, revokePartnerAppearanceEditor } from "./actions";

export const dynamic = "force-dynamic";

export default async function PartnerEditorsPage() {
  await requireAdminPage();
  const grants = await prisma.oremea_partner_appearance_editors.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
    select: { id: true, partner_slug: true, user_id: true, revoked_at: true },
  });
  return (
    <main className="min-h-screen bg-[#090909] px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-7">
        <Link href="/admin/partner-appearance" className="text-sm underline">
          Back to partner appearance
        </Link>
        <h1 className="text-3xl font-light">Appearance editor permissions</h1>
        <p className="text-sm leading-7 text-zinc-300">
          Admins may permit a verified Clerk account to edit one partner's
          colours and draft backgrounds. This does not grant membership access,
          allow publication, expose private journals or change Whop products.
        </p>
        <form action={grantPartnerAppearanceEditor}
          className="grid gap-3 rounded-xl border border-white/20 p-5 md:grid-cols-[1fr_2fr_auto]">
          <label className="text-xs text-zinc-300">
            Partner
            <select name="partnerSlug" required
              className="mt-2 block w-full rounded-lg border border-white/25 bg-[#161616] p-3 text-white">
              {Object.values(OREMEA_PARTNER_EXPERIENCES).map(partner =>
                <option key={partner.slug} value={partner.slug}>{partner.brand.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-zinc-300">
            Verified Clerk user ID
            <input name="userId" required placeholder="user_..."
              className="mt-2 block w-full rounded-lg border border-white/25 bg-[#161616] p-3 text-sm text-white" />
          </label>
          <button type="submit" className="self-end rounded-lg border border-amber-500 px-4 py-3 text-sm">
            Grant editor
          </button>
        </form>
        <section className="space-y-3">
          <h2 className="text-xl">Existing editor permissions</h2>
          {grants.length === 0 && <p className="text-sm text-zinc-400">No partner editors granted yet.</p>}
          {grants.map(grant => (
            <div key={grant.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 p-4">
              <div className="text-sm">
                <p>{grant.partner_slug} · {grant.revoked_at ? "Revoked" : "Active"}</p>
                <p className="mt-1 font-mono text-xs text-zinc-400">{grant.user_id}</p>
              </div>
              {!grant.revoked_at && (
                <form action={revokePartnerAppearanceEditor}>
                  <input type="hidden" name="partnerSlug" value={grant.partner_slug} />
                  <input type="hidden" name="userId" value={grant.user_id} />
                  <button type="submit" className="rounded-lg border border-red-400/50 px-4 py-2 text-xs">
                    Revoke
                  </button>
                </form>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
