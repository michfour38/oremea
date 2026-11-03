import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  MAX_PARTNER_IMAGE_BYTES,
  MAX_PARTNER_IMAGES,
  isKnownPartner,
  sniffPartnerImage,
} from "@/src/lib/oremea/partner-appearance-contract";
import { getPartnerAppearanceEditor } from "@/src/lib/oremea/partner-appearance-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  if (!isKnownPartner(slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const editor = await getPartnerAppearanceEditor(slug);
  if (!editor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bodyLength = Number(request.headers.get("content-length") ?? 0);
  if (bodyLength > MAX_PARTNER_IMAGE_BYTES + 150_000) {
    return NextResponse.json({ error: "Image exceeds upload limit" }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    const form = await request.formData();
    file = form.get("image");
  } catch {
    return NextResponse.json({ error: "Invalid image upload" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size < 12 ||
    file.size > MAX_PARTNER_IMAGE_BYTES) {
    return NextResponse.json({ error: "Choose a PNG, JPEG or WebP image up to 1.5 MB" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = sniffPartnerImage(bytes, file.type);
  if (!format) {
    return NextResponse.json({ error: "Unsupported or invalid image format" }, { status: 415 });
  }
  const existingCount = await prisma.oremea_partner_appearance_assets.count({
    where: { partner_slug: slug },
  });
  if (existingCount >= MAX_PARTNER_IMAGES) {
    return NextResponse.json({ error: "Image allowance reached. Contact OREMEA admin." }, { status: 409 });
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const duplicate = await prisma.oremea_partner_appearance_assets.findFirst({
    where: { partner_slug: slug, sha256, content_type: format.mime },
    select: { filename: true },
  });
  if (duplicate) {
    return NextResponse.json({
      path: `/partner-assets/${slug}/${duplicate.filename}`,
      deduplicated: true,
    }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const filename = `img-${randomUUID()}.${format.ext}`;
  await prisma.oremea_partner_appearance_assets.create({
    data: {
      partner_slug: slug,
      filename,
      content_type: format.mime,
      file_size: bytes.byteLength,
      sha256,
      file_bytes: Buffer.from(bytes),
      uploaded_by: editor.userId,
    },
  });

  return NextResponse.json({ path: `/partner-assets/${slug}/${filename}`, uploaded: true },
    { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
