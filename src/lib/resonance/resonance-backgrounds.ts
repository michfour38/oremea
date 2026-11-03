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
 * For a verified partner, NEVER fall back to OREMEA's one-of-a-kind paintings.
 * Missing partner imagery intentionally yields a neutral background.
 */
export function getResonanceSceneBackgrounds(
  scene: Scene,
  partnerBrand: PartnerBrand | null = null,
): Backgrounds {
  if (!partnerBrand) return originalResonanceBackgrounds(scene);
  const chosen = scene === "entry"
    ? partnerBrand.resonanceScenes.entry
    : scene === "archive"
      ? partnerBrand.resonanceScenes.archive
      : partnerBrand.resonanceScenes.rooms[scene];
  const desktop = safePartnerBackgroundAsset(chosen?.desktop ?? null);
  const mobile = safePartnerBackgroundAsset(chosen?.mobile ?? null) ?? desktop;
  return { desktop, mobile };
}
