import type { PartnerExperience } from "../oremea/partner-experiences";
import { safePartnerBackgroundAsset } from "../oremea/partner-theme";

type PartnerBrand = PartnerExperience["brand"];
type Scene = "entry" | "archive" | number;

const roomSlugs = [
  "hearth", "mirror", "garden", "compass", "pulse", "shadow",
  "forge", "vision", "the-gathering", "the-becoming",
] as const;

type Backgrounds = Readonly<{ desktop: string | null; mobile: string | null }>;

/** Author-owned Resonance images, exclusively for unbranded OREMEA journeys. */
function originalResonanceBackgrounds(scene: Scene): Backgrounds {
  const suffix = scene === "entry" ? "entry"
    : scene === "archive" ? "archive"
      : roomSlugs[scene - 1] ?? roomSlugs[0];
  return {
    desktop: `/images/desktop/bg-${suffix}.webp`,
    mobile: `/images/mobile/bg-${suffix}.webp`,
  };
}

/**
 * OREMEA's paintings are the default. Partners can keep them, customise any
 * subset of scenes, or use a plain background. None of these choices require
 * changing the product pages or the original assets.
 */
export function getResonanceSceneBackgrounds(
  scene: Scene,
  partnerBrand: PartnerBrand | null = null,
): Backgrounds {
  const originals = originalResonanceBackgrounds(scene);
  if (!partnerBrand || partnerBrand.resonanceScenes.mode === "original") {
    return originals;
  }
  if (partnerBrand.resonanceScenes.mode === "plain") {
    return { desktop: null, mobile: null };
  }

  const chosen = scene === "entry"
    ? partnerBrand.resonanceScenes.entry
    : scene === "archive"
      ? partnerBrand.resonanceScenes.archive
      : partnerBrand.resonanceScenes.rooms[scene];
  const customDesktop = safePartnerBackgroundAsset(chosen?.desktop ?? null);
  const customMobile = safePartnerBackgroundAsset(chosen?.mobile ?? null);
  return {
    desktop: customDesktop ?? originals.desktop,
    mobile: customMobile ?? customDesktop ?? originals.mobile,
  };
}
