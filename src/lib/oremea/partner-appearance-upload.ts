import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

import {
  MAX_PARTNER_IMAGE_BYTES,
  MAX_PARTNER_IMAGES,
  isKnownPartner,
  sniffPartnerImage,
} from "./partner-appearance-contract";

/**
 * Transactional quota and content deduplication for private partner artwork.
 * Auth, same-origin checks, and full image decoding happen in the route before
 * this helper is reached. This helper takes a Prisma client so it can be
 * exercised against disposable PostgreSQL in CI.
 */
export class PartnerImageQuotaExceeded extends Error {
  constructor() { super("Image allowance reached. Contact OREMEA admin."); }
}

export async function storePrivatePartnerImage(args: {
  db: PrismaClient;
  slug: string;
  uploadedBy: string;
  bytes: Uint8Array;
  declaredType: string;
}) {
  const { db, slug, uploadedBy, bytes, declaredType } = args;
  if (!isKnownPartner(slug) || !uploadedBy.trim() ||
    bytes.byteLength > MAX_PARTNER_IMAGE_BYTES) {
    throw new Error("Invalid partner image upload");
  }
  const format = sniffPartnerImage(bytes, declaredType);
  if (!format) throw new Error("Unsupported image content");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return db.$transaction(async tx => {
    // The count, deduplication, and insert must be atomic even when a partner
    // submits several uploads simultaneously in multiple browser sessions.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`partner-image-quota:${slug}`}))::text`;
    const existing = await tx.oremea_partner_appearance_assets.findFirst({
      where: { partner_slug: slug, content_type: format.mime, sha256 },
      select: { filename: true },
    });
    if (existing) {
      return {
        path: `/partner-assets/${slug}/${existing.filename}`,
        deduplicated: true,
      };
    }
    const count = await tx.oremea_partner_appearance_assets.count({
      where: { partner_slug: slug },
    });
    if (count >= MAX_PARTNER_IMAGES) throw new PartnerImageQuotaExceeded();
    const filename = `img-${randomUUID()}.${format.ext}`;
    await tx.oremea_partner_appearance_assets.create({
      data: {
        partner_slug: slug, filename, uploaded_by: uploadedBy,
        content_type: format.mime, file_size: bytes.byteLength, sha256,
        file_bytes: Buffer.from(bytes),
      },
    });
    return { path: `/partner-assets/${slug}/${filename}`, uploaded: true };
  });
}
