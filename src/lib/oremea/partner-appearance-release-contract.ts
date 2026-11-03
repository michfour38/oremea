import type { PartnerAppearanceDraft } from "./partner-appearance-contract";
import { draftAssetPath, isKnownPartner } from "./partner-appearance-contract";

export const partnerAppearanceReleaseEnabled = () =>
  process.env.OREMEA_PARTNER_APPEARANCE_RELEASE_ENABLED === "true";

const mediaPattern = /^img-[0-9a-f-]{36}\.webp$/i;

export function validReleasedMediaFilename(filename: string) {
  return mediaPattern.test(filename);
}

function releasedPath(slug: string, source: string | null): string | null {
  if (source === null) return null;
  const checked = draftAssetPath(source, slug);
  if (!checked) return null;
  const basename = checked.slice(checked.lastIndexOf("/") + 1);
  const filename = basename.replace(/\.(png|jpg|webp)$/i, ".webp");
  if (!validReleasedMediaFilename(filename)) throw new Error("Invalid approved asset");
  return `/partner-media/${slug}/${filename}`;
}

/** Converts validated draft-only paths to separately sanitized public media paths. */
export function createApprovedAppearance(
  slug: string,
  draft: PartnerAppearanceDraft,
): PartnerAppearanceDraft {
  if (!isKnownPartner(slug)) throw new Error("Unknown partner");
  const mapScene = (scene: { desktop: string | null; mobile: string | null }) => ({
    desktop: releasedPath(slug, scene.desktop),
    mobile: releasedPath(slug, scene.mobile),
  });
  const rooms: Record<number, ReturnType<typeof mapScene>> = {};
  for (const [room, images] of Object.entries(draft.resonanceScenes.rooms)) {
    if (!images) continue;
    rooms[Number(room)] = mapScene(images);
  }
  return {
    ...draft,
    backgroundAssetPath: releasedPath(slug, draft.backgroundAssetPath),
    mobileBackgroundAssetPath: releasedPath(slug, draft.mobileBackgroundAssetPath),
    resonanceScenes: {
      ...draft.resonanceScenes,
      entry: mapScene(draft.resonanceScenes.entry),
      archive: mapScene(draft.resonanceScenes.archive),
      rooms,
    },
  };
}

export function validateApprovedAppearance(
  incoming: unknown,
  slug: string,
): PartnerAppearanceDraft | null {
  if (!isKnownPartner(slug) || !incoming || typeof incoming !== "object" ||
    Array.isArray(incoming)) return null;
  const d = incoming as Record<string, unknown>;
  const s = d.resonanceScenes as Record<string, unknown> | null;
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  if (![d.background, d.foreground, d.accent].every(
    v => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v),
  )) return null;
  if (!["original", "custom", "plain"].includes(String(s.mode))) return null;

  const validatePath = (p: unknown): p is string | null => {
    if (p === null) return true;
    if (typeof p !== "string") return false;
    const prefix = `/partner-media/${slug}/`;
    return p.startsWith(prefix) && validReleasedMediaFilename(p.slice(prefix.length));
  };
  const validScene = (value: unknown): boolean => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    return validatePath(record.desktop) && validatePath(record.mobile);
  };
  const rooms = s.rooms;
  if (!rooms || typeof rooms !== "object" || Array.isArray(rooms)) return null;
  const entries = Object.entries(rooms);
  if (entries.length > 10 || entries.some(([key, value]) =>
    !/^(10|[1-9])$/.test(key) || !validScene(value)
  )) return null;
  if (!validPath(d.backgroundAssetPath) || !validPath(d.mobileBackgroundAssetPath) ||
    !validScene(s.entry) || !validScene(s.archive)) return null;
  return incoming as PartnerAppearanceDraft;
}

export function referencedReleasedFilenames(snapshot: PartnerAppearanceDraft): string[] {
  const scenes = [
    snapshot.resonanceScenes.entry,
    snapshot.resonanceScenes.archive,
    ...Object.values(snapshot.resonanceScenes.rooms).filter(
      (v): v is { desktop: string | null; mobile: string | null } => Boolean(v)
    ),
  ];
  const paths = [
    snapshot.backgroundAssetPath,
    snapshot.mobileBackgroundAssetPath,
    ...scenes.flatMap(s => [s.desktop, s.mobile]),
  ];
  return [...new Set(paths.filter((p): p is string => p !== null))]
    .map(p => p.slice(p.lastIndexOf("/") + 1));
}
