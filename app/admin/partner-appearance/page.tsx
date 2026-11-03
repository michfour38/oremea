import type { Metadata } from "next";
import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import { PartnerAppearancePreview } from "@/components/admin/partner-appearance-preview";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { OREMEA_PARTNER_EXPERIENCES } from "@/src/lib/oremea/partner-experiences";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Partner appearance preview | OREMEA Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin-only visual rehearsal. Does not save anything or change a customer's
 * partner theme, payments or product access. No SUSTAIN integration.
 */
export default async function PartnerAppearancePage() {
  await requireAdminPage();
  const partner = OREMEA_PARTNER_EXPERIENCES.angela;

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl space-y-6 px-5 py-10 md:px-10">
        <Link href="/admin" className="text-sm text-[var(--oremea-gold)] underline underline-offset-4">
          Back to OREMEA Admin
        </Link>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--oremea-gold)]">
            Partner visuals · private preview
          </p>
          <h1 className="text-3xl font-light md:text-5xl">Resonance backgrounds</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-300">
            Compare the original OREMEA scenes with optional partner artwork or
            a plain background. Nothing here changes live pages. The artwork
            you created remains intact.
          </p>
        </div>
        <PartnerAppearancePreview partnerName={partner.brand.name} initialBrand={partner.brand} />
      </section>
    </SiteShell>
  );
}
