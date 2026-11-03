import type { CSSProperties } from "react";
import type { PartnerExperience } from "./partner-experiences";

export type PartnerBrand = PartnerExperience["brand"];

/**
 * The partner can change the visual identity in one configuration record.
 * Guard against accidentally embedding an external URL or raw CSS payload.
 */
export function safePartnerBackgroundAsset(value: string | null): string | null {
  if (!value) return null;
  return /^\/partner-(?:assets|media)\/[a-z0-9-]+\/[a-z0-9/_-]+\.(?:png|jpe?g|webp|avif)$/i.test(value)
    ? value
    : null;
}

export function partnerThemeStyle(brand: PartnerBrand): CSSProperties {
  const asset = safePartnerBackgroundAsset(brand.backgroundAssetPath);
  const mobileAsset =
    safePartnerBackgroundAsset(brand.mobileBackgroundAssetPath) ?? asset;
  return {
    "--partner-bg": brand.background,
    "--partner-foreground": brand.foreground,
    "--partner-accent": brand.accent,
    "--partner-bg-image": asset ? `url("${asset}")` : "none",
    "--partner-bg-image-mobile": mobileAsset ? `url("${mobileAsset}")` : "none",
  } as CSSProperties;
}
