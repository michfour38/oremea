import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedPartnerExperience,
  PARTNER_PRODUCT_LABELS,
} from "@/src/lib/oremea/partner-experiences";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const partner = getPublishedPartnerExperience(slug);
  return {
    title: partner ? `${partner.brand.name} | OREMEA` : "Not found | OREMEA",
    // Partners are reviewed individually before search indexing is enabled.
    robots: { index: false, follow: false },
  };
}

/**
 * Shared presentation for every verified partner. The config, not this page,
 * defines their branding, offers, and provider checkout references.
 * No checkout is shown until a partner AND specific offer are published.
 */
export default async function PartnerLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const partner = getPublishedPartnerExperience(slug);
  if (!partner) notFound();

  const { brand, offers } = partner;
  const backgroundImage = brand.backgroundAssetPath?.startsWith("/")
    ? `url("${brand.backgroundAssetPath}")`
    : undefined;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "clamp(24px, 6vw, 80px)",
        backgroundColor: brand.background,
        backgroundImage,
        backgroundSize: "cover",
        color: brand.foreground,
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <p style={{ letterSpacing: "0.15em", color: brand.accent }}>
          {brand.name}
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 4rem)", lineHeight: 1.1, marginTop: 20 }}>
          {brand.headline}
        </h1>
        <p style={{ maxWidth: 650, marginTop: 20, marginBottom: 40 }}>
          {brand.introduction}
        </p>
        <section aria-label="Available programmes" style={{ display: "grid", gap: 20 }}>
          {offers.map((offer) => (
            <article
              key={offer.key}
              style={{
                border: `1px solid ${brand.accent}`,
                backgroundColor: brand.background,
                borderRadius: 14,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: "1.45rem" }}>{offer.title}</h2>
              <p style={{ marginTop: 8 }}>
                {offer.purchaseMode === "subscription"
                  ? "Monthly recurring billing"
                  : "One-off payment"} · {offer.programmeMonths}-month programme
              </p>
              <ul style={{ marginTop: 14, marginBottom: 20, paddingLeft: 24 }}>
                {offer.includedProducts.map((product) => (
                  <li key={product}>{PARTNER_PRODUCT_LABELS[product]}</li>
                ))}
              </ul>
              <a
                href={offer.checkout.href}
                rel="nofollow noopener noreferrer"
                style={{
                  color: brand.background,
                  backgroundColor: brand.accent,
                  padding: "12px 18px",
                  display: "inline-block",
                  borderRadius: 8,
                  fontWeight: 600,
                }}
              >
                Review payment details
              </a>
            </article>
          ))}
        </section>
        <p style={{ marginTop: 40, opacity: 0.8, fontSize: "0.9rem" }}>
          OREMEA provides the underlying tools. Each person's private records remain
          theirs; programme participation does not grant the facilitator access to them.
        </p>
      </div>
    </main>
  );
}
