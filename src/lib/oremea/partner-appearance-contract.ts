import type { PartnerBrand } from "./partner-theme";
import { OREMEA_PARTNER_EXPERIENCES } from "./partner-experiences";
import { safePartnerBackgroundAsset } from "./partner-theme";

export type PartnerAppearanceDraft = Pick<
  PartnerBrand,
  "background" | "foreground" | "accent" |
  "backgroundAssetPath" | "mobileBackgroundAssetPath" | "resonanceScenes"
>;
export const MAX_PARTNER_IMAGE_BYTES = 1_500_000;
export const MAX_PARTNER_IMAGES = 28;

export function isKnownPartner(slug: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(slug) &&
    Object.prototype.hasOwnProperty.call(OREMEA_PARTNER_EXPERIENCES, slug);
}

export function initialAppearanceDraft(slug: string): PartnerAppearanceDraft {
  if (!isKnownPartner(slug)) throw new Error("Unknown partner");
  const experience = OREMEA_PARTNER_EXPERIENCES[
    slug as keyof typeof OREMEA_PARTNER_EXPERIENCES
  ];
  return {
    background: experience.brand.background,
    foreground: experience.brand.foreground,
    accent: experience.brand.accent,
    backgroundAssetPath: experience.brand.backgroundAssetPath,
    mobileBackgroundAssetPath: experience.brand.mobileBackgroundAssetPath,
    resonanceScenes: experience.brand.resonanceScenes,
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" &&
    !Array.isArray(value) ? value as Record<string, unknown> : null;
}

const validHex = (v: unknown): v is string =>
  typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);

/** Draft assets must already have been uploaded to this precise partner. */
export function draftAssetPath(value: unknown, slug: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 150 ||
    !safePartnerBackgroundAsset(value)) {
    throw new Error("Invalid partner image path");
  }
  if (!new RegExp(`^/partner-assets/${slug}/img-[0-9a-f-]{36}\\.(png|jpg|webp)$`, "i").test(value)) {
    throw new Error("Partner asset is not in the approved upload directory");
  }
  return value;
}

/** Ignore extra input keys; only appearance can be saved, never pricing/access. */
export function parsePartnerAppearanceDraft(
  incoming: unknown,
  slug: string,
): PartnerAppearanceDraft {
  if (!isKnownPartner(slug)) throw new Error("Unknown partner");
  const data = record(incoming);
  const scenes = record(data?.resonanceScenes);
  if (!data || !scenes || !validHex(data.background) ||
    !validHex(data.foreground) || !validHex(data.accent)) {
    throw new Error("Invalid partner colours or scene structure");
  }
  const mode = scenes.mode;
  if (mode !== "original" && mode !== "custom" && mode !== "plain") {
    throw new Error("Unknown Resonance scene mode");
  }
  function sceneAssets(v: unknown) {
    const obj = record(v);
    if (!obj) throw new Error("Invalid scene assets");
    return {
      desktop: draftAssetPath(obj.desktop ?? null, slug),
      mobile: draftAssetPath(obj.mobile ?? null, slug),
    };
  }
  const roomsInput = record(scenes.rooms);
  if (!roomsInput || Object.keys(roomsInput).length > 10) {
    throw new Error("Invalid room configuration");
  }
  const rooms: Record<number, ReturnType<typeof sceneAssets>> = {};
  for (const [key, value] of Object.entries(roomsInput)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 1 || index > 10 ||
      String(index) !== key) throw new Error("Unknown Resonance room");
    rooms[index] = sceneAssets(value);
  }
  return {
    background: data.background,
    foreground: data.foreground,
    accent: data.accent,
    backgroundAssetPath: draftAssetPath(data.backgroundAssetPath ?? null, slug),
    mobileBackgroundAssetPath: draftAssetPath(data.mobileBackgroundAssetPath ?? null, slug),
    resonanceScenes: {
      mode,
      entry: sceneAssets(scenes.entry),
      archive: sceneAssets(scenes.archive),
      rooms,
    },
  };
}

export function referencedPartnerImageFiles(draft: PartnerAppearanceDraft): string[] {
  const paths: (string | null)[] = [
    draft.backgroundAssetPath,
    draft.mobileBackgroundAssetPath,
    draft.resonanceScenes.entry.desktop,
    draft.resonanceScenes.entry.mobile,
    draft.resonanceScenes.archive.desktop,
    draft.resonanceScenes.archive.mobile,
    ...Object.values(draft.resonanceScenes.rooms)
      .flatMap(image => [image?.desktop ?? null, image?.mobile ?? null]),
  ];
  return [...new Set(paths.filter((path): path is string => Boolean(path)))]
    .map(path => path.slice(path.lastIndexOf("/") + 1));
}

export type ApprovedPartnerImageMime = "image/png" | "image/jpeg" | "image/webp";

export function sniffPartnerImage(
  bytes: Uint8Array,
  declaredType: string,
): { mime: ApprovedPartnerImageMime; ext: "png" | "jpg" | "webp" } | null {
  if (bytes.length < 12 || bytes.length > MAX_PARTNER_IMAGE_BYTES) return null;
  if (declaredType === "image/png" &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((byte, index) => bytes[index] === byte)) {
    return { mime: "image/png", ext: "png" };
  }
  if (declaredType === "image/jpeg" &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (declaredType === "image/webp" && riff === "RIFF" && webp === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}
