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

export const MAX_PARTNER_IMAGE_PIXELS = 20_000_000;

/**
 * Fail early on corrupt/truncated image data, mismatched MIME declarations,
 * animated files, and decompression bombs. A matching file signature alone
 * is not proof that the image is valid or safe to process.
 */
export async function validatePrivatePartnerImage(
  raw: Uint8Array,
  expectedMime: "image/png" | "image/jpeg" | "image/webp",
): Promise<void> {
  const image = sharp(Buffer.from(raw), {
    failOn: "error",
    limitInputPixels: MAX_PARTNER_IMAGE_PIXELS,
    animated: false,
  });
  const metadata = await image.metadata();
  const expectedFormat = expectedMime === "image/jpeg" ? "jpeg"
    : expectedMime === "image/png" ? "png" : "webp";
  if (metadata.format !== expectedFormat ||
    !metadata.width || !metadata.height ||
    metadata.width * metadata.height > MAX_PARTNER_IMAGE_PIXELS ||
    (metadata.pages ?? 1) !== 1) {
    throw new Error("Invalid image format, dimensions or animation");
  }
  // Decode the image, rather than accepting headers of a truncated file.
  await sharp(Buffer.from(raw), {
    failOn: "error", limitInputPixels: MAX_PARTNER_IMAGE_PIXELS,
  }).resize(1, 1).toBuffer();
}
