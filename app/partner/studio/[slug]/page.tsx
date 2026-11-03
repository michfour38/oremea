import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PartnerAppearancePreview } from "@/components/admin/partner-appearance-preview";
import { getPartnerAppearanceEditor } from "@/src/lib/oremea/partner-appearance-server";
import { OREMEA_PARTNER_EXPERIENCES } from "@/src/lib/oremea/partner-experiences";
import { isKnownPartner } from "@/src/lib/oremea/partner-appearance-contract";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Partner appearance studio | OREMEA",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ slug: string }> };

/** Only an owner/admin or a specific granted partner editor can enter. */
export default async function PartnerStudioPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isKnownPartner(slug)) notFound();
  const editor = await getPartnerAppearanceEditor(slug);
  if (!editor) notFound();

  const partner = OREMEA_PARTNER_EXPERIENCES[
    slug as keyof typeof OREMEA_PARTNER_EXPERIENCES
  ];
  return (
    <main className="min-h-screen bg-[#0b0b0b] px-5 py-10 text-white md:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--oremea-gold)]">
          Private partner studio
        </p>
        <h1 className="text-3xl font-light md:text-5xl">{partner.brand.name} · Appearance</h1>
        <p className="max-w-3xl text-sm leading-7 text-zinc-300">
          Choose your colours and Resonance backgrounds. Changes are saved
          privately as drafts for OREMEA approval; no product content,
          subscription or customer permission is affected.
        </p>
        <PartnerAppearancePreview
          partnerSlug={partner.slug}
          partnerName={partner.brand.name}
          initialBrand={partner.brand}
        />
      </div>
    </main>
  );
}
