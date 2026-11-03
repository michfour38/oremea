import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  isKnownPartner,
  parsePartnerAppearanceDraft,
  referencedPartnerImageFiles,
  type PartnerAppearanceDraft,
} from "./partner-appearance-contract";
import { getPublishedPartnerExperience, type PartnerExperience } from "./partner-experiences";
import {
  createApprovedAppearance,
  partnerAppearanceReleaseEnabled,
  referencedReleasedFilenames,
  validateApprovedAppearance,
} from "./partner-appearance-release-contract";

export class AppearanceApprovalConflict extends Error {
  constructor() { super("Draft or approval changed. Reload before reviewing again."); }
}

/**
 * Admin-controlled image transformation: decode pixels, orient image, resize,
 * and re-encode to new WebP bytes WITHOUT .withMetadata(). Never expose the
 * original upload, EXIF, GPS, XMP, ICC profiles, or arbitrary file contents.
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

export async function getCurrentApprovedPartnerAppearance(slug: string) {
  if (!isKnownPartner(slug)) return null;
  const published = await prisma.oremea_partner_appearance_publications.findUnique({
    where: { partner_slug: slug },
    select: { snapshot: true, source_revision: true, approval_version: true, is_active: true, approved_at: true, approved_by: true },
  });
  if (!published) return null;
  const snapshot = validateApprovedAppearance(published.snapshot, slug);
  if (!snapshot) return null;
  return {
    snapshot,
    sourceRevision: published.source_revision,
    approvalVersion: published.approval_version,
    isActive: published.is_active,
    approvedAt: published.approved_at,
    approvedBy: published.approved_by,
  };
}

/** Consumed only for an approved live partner and only when release is enabled. */
export async function getReleasedPartnerBrand(
  partner: PartnerExperience,
): Promise<PartnerExperience["brand"]> {
  if (!partnerAppearanceReleaseEnabled() ||
    !getPublishedPartnerExperience(partner.slug)) return partner.brand;
  const approved = await getCurrentApprovedPartnerAppearance(partner.slug);
  return approved?.isActive ? { ...partner.brand, ...approved.snapshot } : partner.brand;
}

export async function approveSavedPartnerAppearance({
  slug,
  adminId,
  expectedDraftRevision,
  expectedApprovalVersion,
}: {
  slug: string;
  adminId: string;
  expectedDraftRevision: number;
  expectedApprovalVersion: number;
}) {
  if (!isKnownPartner(slug) || !Number.isInteger(expectedDraftRevision) ||
    expectedDraftRevision < 1 || !Number.isInteger(expectedApprovalVersion) ||
    expectedApprovalVersion < 0 || !adminId.trim()) {
    throw new Error("Invalid approval request");
  }

  const draftRow = await prisma.oremea_partner_appearances.findUnique({
    where: { partner_slug: slug },
    select: { draft: true, revision: true },
  });
  if (!draftRow || draftRow.revision !== expectedDraftRevision) {
    throw new AppearanceApprovalConflict();
  }
  const safeDraft = parsePartnerAppearanceDraft(draftRow.draft, slug);
  const names = referencedPartnerImageFiles(safeDraft);
  const sources = names.length
    ? await prisma.oremea_partner_appearance_assets.findMany({
      where: { partner_slug: slug, filename: { in: names } },
      select: { id: true, filename: true, file_bytes: true },
    })
    : [];
  if (sources.length !== names.length) throw new Error("Saved image is missing");

  const publicAssets = await Promise.all(sources.map(async file => {
    const sanitized = await sanitizeApprovedPartnerImage(new Uint8Array(file.file_bytes));
    const filename = file.filename.replace(/\.(png|jpg|webp)$/i, ".webp");
    return {
      partner_slug: slug,
      filename,
      content_type: "image/webp",
      file_bytes: sanitized,
      file_size: sanitized.length,
      sha256: createHash("sha256").update(sanitized).digest("hex"),
      source_id: file.id,
    };
  }));

  const approved = createApprovedAppearance(slug, safeDraft);
  const json = JSON.parse(JSON.stringify(approved)) as Prisma.InputJsonValue;
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`partner-appearance-approve:${slug}`}))::text`;
    const currentDraft = await tx.oremea_partner_appearances.findUnique({
      where: { partner_slug: slug }, select: { revision: true },
    });
    const current = await tx.oremea_partner_appearance_publications.findUnique({
      where: { partner_slug: slug }, select: { approval_version: true },
    });
    if (!currentDraft || currentDraft.revision !== expectedDraftRevision ||
      (current?.approval_version ?? 0) !== expectedApprovalVersion) {
      throw new AppearanceApprovalConflict();
    }
    if (publicAssets.length) {
      await tx.oremea_partner_appearance_public_assets.createMany({
        data: publicAssets, skipDuplicates: true,
      });
    }
    const publication = current
      ? await tx.oremea_partner_appearance_publications.update({
        where: { partner_slug: slug },
        data: {
          snapshot: json,
          source_revision: expectedDraftRevision,
          approval_version: { increment: 1 },
          is_active: true,
          approved_by: adminId,
          approved_at: new Date(),
        },
      })
      : await tx.oremea_partner_appearance_publications.create({
        data: {
          partner_slug: slug, snapshot: json,
          source_revision: expectedDraftRevision, approval_version: 1,
          is_active: true, approved_by: adminId,
        },
      });
    await tx.oremea_partner_appearance_approval_history.create({
      data: {
        partner_slug: slug, action: "approve", actor_id: adminId,
        source_revision: expectedDraftRevision,
        approval_version: publication.approval_version,
        snapshot: json,
      },
    });
    return publication;
  });
  return { approvalVersion: result.approval_version, sourceRevision: result.source_revision };
}

export async function withdrawApprovedPartnerAppearance({
  slug, adminId, expectedApprovalVersion,
}: {
  slug: string;
  adminId: string;
  expectedApprovalVersion: number;
}) {
  if (!isKnownPartner(slug) || !Number.isInteger(expectedApprovalVersion) ||
    expectedApprovalVersion < 1 || !adminId.trim()) throw new Error("Invalid withdrawal");
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`partner-appearance-approve:${slug}`}))::text`;
    const existing = await tx.oremea_partner_appearance_publications.findUnique({
      where: { partner_slug: slug },
    });
    if (!existing || existing.approval_version !== expectedApprovalVersion) {
      throw new AppearanceApprovalConflict();
    }
    const updated = await tx.oremea_partner_appearance_publications.update({
      where: { partner_slug: slug },
      data: { is_active: false, approval_version: { increment: 1 } },
    });
    await tx.oremea_partner_appearance_approval_history.create({
      data: {
        partner_slug: slug, action: "withdraw", actor_id: adminId,
        source_revision: existing.source_revision,
        approval_version: updated.approval_version,
        snapshot: existing.snapshot === Prisma.JsonNull ? undefined
          : (existing.snapshot as Prisma.InputJsonValue),
      },
    });
    return { approvalVersion: updated.approval_version };
  });
}

export async function getReleasedPartnerAsset(slug: string, filename: string) {
  if (!partnerAppearanceReleaseEnabled() ||
    !getPublishedPartnerExperience(slug)) return null;
  const current = await getCurrentApprovedPartnerAppearance(slug);
  if (!current?.isActive || !referencedReleasedFilenames(current.snapshot).includes(filename)) {
    return null;
  }
  return prisma.oremea_partner_appearance_public_assets.findUnique({
    where: { partner_slug_filename: { partner_slug: slug, filename } },
    select: { file_bytes: true, content_type: true },
  });
}
