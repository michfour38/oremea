import type { CSSProperties } from "react";
import type { PartnerExperience } from "./partner-experiences";

export type PartnerBrand = PartnerExperience["brand"];

/**
 * The partner can change the visual identity in one configuration record.
 * Guard against accidentally embedding an external URL or raw CSS payload.
 */
export function safePartnerBackgroundAsset(value: string | null): string | null {
  if (!value) return null;
  return /^\/partner-assets\/[a-z0-9-]+\/[a-z0-9/_-]+\.(?:png|jpe?g|webp|avif)$/i.test(value)
    ? value
    : null;
}

export function partnerThemeStyle(brand: PartnerBrand): CSSProperties {
  const asset = safePartnerBackgroundAsset(brand.backgroundAssetPath);
  return {
    "--partner-bg": brand.background,
    "--partner-foreground": brand.foreground,
    "--partner-accent": brand.accent,
    "--partner-bg-image": asset ? `url("${asset}")` : "none",
  } as CSSProperties;
}
