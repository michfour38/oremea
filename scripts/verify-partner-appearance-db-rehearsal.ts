/**
 * Destructive/mutating smoke tests MUST run only on the disposable PostgreSQL
 * service provisioned by .github/workflows/partner-appearance-db-rehearsal.yml.
 * Never point this at Railway or any real customer database.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import sharp from "sharp";
import {
  MAX_PARTNER_IMAGES,
} from "../src/lib/oremea/partner-appearance-contract";
import {
  PartnerImageQuotaExceeded,
  storePrivatePartnerImage,
} from "../src/lib/oremea/partner-appearance-upload";
import { validatePrivatePartnerImage } from "../src/lib/oremea/partner-appearance-image";

import {
  initialAppearanceDraft,
  parsePartnerAppearanceDraft,
} from "../src/lib/oremea/partner-appearance-contract";
import {
  createApprovedAppearance,
  validateApprovedAppearance,
} from "../src/lib/oremea/partner-appearance-release-contract";
import { resolvePartnerAppearanceAccess } from "../src/lib/oremea/partner-appearance-authorization";

function insistDisposableDatabase() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.equal(process.env.OREMEA_ISOLATED_DB_REHEARSAL, "true");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname),
    "Refusing non-local DB to preserve real OREMEA data.");
  assert.equal(url.pathname, "/oremea_partner_rehearsal",
    "Refusing to mutate anything except the dedicated disposable rehearsal DB.");
  assert.equal(url.port, "5432");
}

async function main() {
  insistDisposableDatabase();
  const db = new PrismaClient();
  const slug = "angela";
  try {
    // Migration is already applied by psql in the same isolated runner.
    const tables = await db.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'oremea_partner_appearance%'
      ORDER BY table_name
    `;
    const names = tables.map(t => t.table_name);
    for (const name of [
      "oremea_partner_appearances",
      "oremea_partner_appearance_editors",
      "oremea_partner_appearance_assets",
      "oremea_partner_appearance_publications",
      "oremea_partner_appearance_public_assets",
      "oremea_partner_appearance_approval_history",
    ]) assert.ok(names.includes(name), `Required migrated table missing: ${name}`);

    const base = parsePartnerAppearanceDraft(initialAppearanceDraft(slug), slug);
    const draft = await db.oremea_partner_appearances.create({
      data: { partner_slug: slug, draft: JSON.parse(JSON.stringify(base)), updated_by: "user_rehearsal_admin" },
    });
    assert.equal(draft.revision, 1);
    assert.equal((await db.oremea_partner_appearances.findUnique({
      where: { partner_slug: slug },
    }))?.revision, 1);

    // Optimistic revision guard stops concurrent edits overwriting each other.
    const changed = await db.oremea_partner_appearances.updateMany({
      where: { partner_slug: slug, revision: 1 },
      data: { revision: { increment: 1 }, updated_by: "user_rehearsal_editor" },
    });
    assert.equal(changed.count, 1);
    const stale = await db.oremea_partner_appearances.updateMany({
      where: { partner_slug: slug, revision: 1 },
      data: { revision: { increment: 1 } },
    });
    assert.equal(stale.count, 0);
    assert.equal((await db.oremea_partner_appearances.findUnique({
      where: { partner_slug: slug },
    }))?.revision, 2);

    // Grant, unique-index protection and revocation are scoped by partner.
    await db.oremea_partner_appearance_editors.create({
      data: { partner_slug: slug, user_id: "user_rehearsal_editor", granted_by: "user_rehearsal_admin" },
    });
    await assert.rejects(
      db.oremea_partner_appearance_editors.create({
        data: { partner_slug: slug, user_id: "user_rehearsal_editor", granted_by: "user_rehearsal_admin" },
      }),
      (error: unknown) =>
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002",
    );
    const activeGrant = await db.oremea_partner_appearance_editors.findUnique({
      where: { partner_slug_user_id: { partner_slug: slug, user_id: "user_rehearsal_editor" } },
      select: { partner_slug: true, user_id: true, revoked_at: true },
    });
    assert.deepEqual(resolvePartnerAppearanceAccess({
      requestedPartner: slug, authenticatedUserId: "user_rehearsal_editor",
      isAdmin: false, exactPartnerGrant: activeGrant,
    }), { userId: "user_rehearsal_editor", role: "editor" });
    assert.equal(resolvePartnerAppearanceAccess({
      requestedPartner: "someone-else", authenticatedUserId: "user_rehearsal_editor",
      isAdmin: false, exactPartnerGrant: activeGrant,
    }), null, "Partner grant must be scoped to its original tenant.");
    await db.oremea_partner_appearance_editors.update({
      where: { partner_slug_user_id: { partner_slug: slug, user_id: "user_rehearsal_editor" } },
      data: { revoked_at: new Date() },
    });
    const grant = await db.oremea_partner_appearance_editors.findUnique({
      where: { partner_slug_user_id: { partner_slug: slug, user_id: "user_rehearsal_editor" } },
    });
    assert.ok(grant?.revoked_at);
    assert.equal(resolvePartnerAppearanceAccess({
      requestedPartner: slug, authenticatedUserId: "user_rehearsal_editor",
      isAdmin: false, exactPartnerGrant: grant,
    }), null, "Revoked account must be denied despite the row still existing.");
    assert.deepEqual(resolvePartnerAppearanceAccess({
      requestedPartner: slug, authenticatedUserId: "user_rehearsal_admin",
      isAdmin: true, exactPartnerGrant: null,
    }), { userId: "user_rehearsal_admin", role: "admin" });

    // Draft assets do not leak across tenant-scoped lookups.
    const filename = "img-11111111-2222-4333-8444-555555555555.png";
    const payload = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
    const rawAsset = await db.oremea_partner_appearance_assets.create({
      data: {
        partner_slug: slug,
        filename,
        content_type: "image/png",
        file_size: payload.length,
        sha256: createHash("sha256").update(payload).digest("hex"),
        file_bytes: payload,
        uploaded_by: "user_rehearsal_editor",
      },
    });
    assert.equal((await db.oremea_partner_appearance_assets.findFirst({
      where: { partner_slug: "different-partner", filename },
    })), null);
    // Upload the way the application does: verify actual decoded PNG pixels,
    // deduplicate identical files, and serialize the quota across concurrent
    // requests. This test runs only against the disposable PostgreSQL service.
    async function pngFor(i: number): Promise<Uint8Array> {
      const colour = "#" + i.toString(16).padStart(6, "0");
      return new Uint8Array(await sharp({
        create: { width: 4, height: 4, channels: 3, background: colour },
      }).png().toBuffer());
    }
    const firstPixels = await pngFor(1);
    await validatePrivatePartnerImage(firstPixels, "image/png");
    await assert.rejects(validatePrivatePartnerImage(payload, "image/png"),
      "A mere PNG header is not a valid uploaded image.");

    const firstUpload = await storePrivatePartnerImage({
      db, slug, uploadedBy: "user_rehearsal_editor",
      bytes: firstPixels, declaredType: "image/png",
    });
    assert.ok("uploaded" in firstUpload);
    const repeated = await storePrivatePartnerImage({
      db, slug, uploadedBy: "user_rehearsal_editor",
      bytes: firstPixels, declaredType: "image/png",
    });
    assert.deepEqual(repeated, {
      path: firstUpload.path, deduplicated: true,
    });

    // There are now 2 unique files: 1 original smoke fixture + 1 decoded PNG.
    for (let i = 2; i < MAX_PARTNER_IMAGES - 2; i++) {
      const bytes = await pngFor(i);
      await storePrivatePartnerImage({
        db, slug, uploadedBy: "user_rehearsal_editor",
        bytes, declaredType: "image/png",
      });
    }
    const filled = await db.oremea_partner_appearance_assets.count({
      where: { partner_slug: slug },
    });
    assert.equal(filled, MAX_PARTNER_IMAGES - 2,
      "The test should leave two slots available for concurrent requests.");
    const simultaneous = await Promise.allSettled(
      [101, 102, 103].map(async i => {
        const bytes = await pngFor(i);
        return storePrivatePartnerImage({
          db, slug, uploadedBy: "user_rehearsal_editor",
          bytes, declaredType: "image/png",
        });
      }),
    );
    assert.equal(simultaneous.filter(x => x.status === "fulfilled").length, 2,
      "Exactly two concurrent uploads may take the last two slots.");
    assert.equal(simultaneous.filter(x =>
      x.status === "rejected" && x.reason instanceof PartnerImageQuotaExceeded).length, 1,
      "The remaining concurrent request must receive the quota error.");
    assert.equal(await db.oremea_partner_appearance_assets.count({
      where: { partner_slug: slug },
    }), MAX_PARTNER_IMAGES);


    const draftWithArtwork = parsePartnerAppearanceDraft({
      ...base,
      resonanceScenes: {
        ...base.resonanceScenes,
        mode: "custom",
        rooms: { 1: { desktop: `/partner-assets/${slug}/${filename}`, mobile: null } },
      },
    }, slug);
    const approved = createApprovedAppearance(slug, draftWithArtwork);
    assert.ok(validateApprovedAppearance(approved, slug));
    assert.equal(validateApprovedAppearance(approved, "different-partner"), null);

    // Approved media contains a separate copy and has an independent URL.
    const approvedFilename = filename.replace(".png", ".webp");
    await db.oremea_partner_appearance_public_assets.create({
      data: {
        partner_slug: slug,
        filename: approvedFilename,
        file_bytes: Buffer.from([82, 73, 70, 70]),
        file_size: 4,
        sha256: "rehearsal-only",
        source_id: rawAsset.id,
      },
    });
    assert.equal((await db.oremea_partner_appearance_public_assets.findUnique({
      where: { partner_slug_filename: { partner_slug: "different-partner", filename: approvedFilename } },
    })), null);

    const json = JSON.parse(JSON.stringify(approved)) as Prisma.InputJsonValue;
    await db.oremea_partner_appearance_publications.create({
      data: {
        partner_slug: slug, snapshot: json, source_revision: 2,
        approval_version: 1, is_active: true, approved_by: "user_rehearsal_admin",
      },
    });
    await db.oremea_partner_appearance_approval_history.create({
      data: {
        partner_slug: slug, action: "approve", actor_id: "user_rehearsal_admin",
        source_revision: 2, approval_version: 1, snapshot: json,
      },
    });
    const withdrawn = await db.oremea_partner_appearance_publications.update({
      where: { partner_slug: slug },
      data: { is_active: false, approval_version: { increment: 1 } },
    });
    assert.equal(withdrawn.approval_version, 2);
    assert.equal(withdrawn.is_active, false);
    await db.oremea_partner_appearance_approval_history.create({
      data: {
        partner_slug: slug, action: "withdraw", actor_id: "user_rehearsal_admin",
        source_revision: 2, approval_version: 2, snapshot: json,
      },
    });
    const audit = await db.oremea_partner_appearance_approval_history.findMany({
      where: { partner_slug: slug }, orderBy: { created_at: "asc" },
    });
    assert.equal(audit.length, 2);
    assert.deepEqual(new Set(audit.map(a => a.action)), new Set(["approve", "withdraw"]));
    assert.equal((await db.oremea_partner_appearances.findUnique({
      where: { partner_slug: slug },
    }))?.revision, 2, "Withdrawing approved artwork must not alter the draft.");
    console.log("Disposable PostgreSQL migration, revision, grants, tenant isolation, approval and withdrawal rehearsal passed.");
  } finally {
    await db.$disconnect();
  }
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
