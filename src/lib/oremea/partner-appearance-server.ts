import "server-only";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isOremeaAdmin } from "@/lib/auth/admin-access";
import {
  initialAppearanceDraft,
  isKnownPartner,
  parsePartnerAppearanceDraft,
  referencedPartnerImageFiles,
  type PartnerAppearanceDraft,
} from "./partner-appearance-contract";

export type PartnerEditorRole = "admin" | "editor";
export type PartnerEditorAccess = { userId: string; role: PartnerEditorRole };

export async function getPartnerAppearanceEditor(
  slug: string,
): Promise<PartnerEditorAccess | null> {
  if (!isKnownPartner(slug)) return null;
  const { userId } = await auth();
  if (!userId) return null;
  if (await isOremeaAdmin(userId)) return { userId, role: "admin" };
  const grant = await prisma.oremea_partner_appearance_editors.findUnique({
    where: { partner_slug_user_id: { partner_slug: slug, user_id: userId } },
    select: { revoked_at: true },
  });
  return grant && grant.revoked_at === null ? { userId, role: "editor" } : null;
}

export async function readPartnerAppearanceDraft(slug: string) {
  const defaultDraft = initialAppearanceDraft(slug);
  const stored = await prisma.oremea_partner_appearances.findUnique({
    where: { partner_slug: slug },
    select: { draft: true, revision: true, updated_at: true },
  });
  const draft = stored ? parsePartnerAppearanceDraft(stored.draft, slug) : defaultDraft;
  return {
    revision: stored?.revision ?? 0,
    updatedAt: stored?.updated_at?.toISOString() ?? null,
    appearance: draft,
  };
}

export class AppearanceConflictError extends Error {
  constructor() { super("Appearance changed in another session. Reload before saving."); }
}

export async function savePartnerAppearanceDraft(args: {
  slug: string;
  userId: string;
  expectedRevision: number;
  appearance: unknown;
}) {
  const { slug, userId, expectedRevision, appearance } = args;
  if (!isKnownPartner(slug)) throw new Error("Unknown partner");
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error("Invalid appearance revision");
  }
  const safe = parsePartnerAppearanceDraft(appearance, slug);
  const names = referencedPartnerImageFiles(safe);
  if (names.length) {
    const stored = await prisma.oremea_partner_appearance_assets.findMany({
      where: { partner_slug: slug, filename: { in: names } },
      select: { filename: true },
    });
    if (stored.length !== names.length) {
      throw new Error("Upload and verify partner images before saving.");
    }
  }
  const json = JSON.parse(JSON.stringify(safe)) as Prisma.InputJsonValue;

  if (expectedRevision === 0) {
    try {
      await prisma.oremea_partner_appearances.create({
        data: { partner_slug: slug, draft: json, updated_by: userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002") throw new AppearanceConflictError();
      throw error;
    }
    return readPartnerAppearanceDraft(slug);
  }

  const changed = await prisma.oremea_partner_appearances.updateMany({
    where: { partner_slug: slug, revision: expectedRevision },
    data: { draft: json, revision: { increment: 1 }, updated_by: userId },
  });
  if (changed.count !== 1) throw new AppearanceConflictError();
  return readPartnerAppearanceDraft(slug);
}
