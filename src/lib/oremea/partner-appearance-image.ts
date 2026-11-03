import sharp from "sharp";

/**
 * Convert private uploads into new, decoded and re-encoded WebP images.
 * The output contains pixels, not copied original EXIF/GPS, XMP or ICC chunks.
 * Use no withMetadata()/keepMetadata() methods.
 */
export async function sanitizeApprovedPartnerImage(raw: Uint8Array) {
  const buffer = await sharp(Buffer.from(raw), {
    failOn: "error",
    limitInputPixels: 20_000_000,
  })
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toBuffer();
  if (buffer.length === 0 || buffer.length > 2_000_000) {
    throw new Error("Approved partner image exceeds 2 MB after re-encoding");
  }
  const metadata = await sharp(buffer).metadata();
  if (metadata.exif || metadata.xmp || metadata.icc) {
    throw new Error("Approved image still includes metadata");
  }
  return buffer;
}
