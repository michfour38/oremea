import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  MAX_PARTNER_IMAGE_BYTES,
  isKnownPartner,
  sniffPartnerImage,
} from "@/src/lib/oremea/partner-appearance-contract";
import { validatePrivatePartnerImage } from "@/src/lib/oremea/partner-appearance-image";
import { getPartnerAppearanceEditor } from "@/src/lib/oremea/partner-appearance-server";
import {
  PartnerImageQuotaExceeded,
  storePrivatePartnerImage,
} from "@/src/lib/oremea/partner-appearance-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ slug: string }> };

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0" };
const error = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: privateHeaders });

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  if (!isKnownPartner(slug)) return error("Not found", 404);
  const editor = await getPartnerAppearanceEditor(slug);
  if (!editor) return error("Forbidden", 403);
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return error("Invalid request origin", 403);
  }
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) {
    return error("A multipart image upload is required", 415);
  }
  // Avoid buffering unbounded chunked multipart bodies in request.formData().
  // Standard browser uploads supply Content-Length; unknown length fails closed.
  const declaredLength = request.headers.get("content-length");
  if (!declaredLength || !/^[1-9][0-9]*$/.test(declaredLength)) {
    return error("Image upload length is required", 411);
  }
  const bodyLength = Number(declaredLength);
  if (!Number.isSafeInteger(bodyLength) || bodyLength > MAX_PARTNER_IMAGE_BYTES + 150_000) {
    return error("Image exceeds upload limit", 413);
  }

  let file: FormDataEntryValue | null;
  try {
    const form = await request.formData();
    file = form.get("image");
  } catch {
    return error("Invalid image upload", 400);
  }
  if (!(file instanceof File) || file.size < 12 ||
    file.size > MAX_PARTNER_IMAGE_BYTES) {
    return error("Choose a PNG, JPEG or WebP image up to 1.5 MB", 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = sniffPartnerImage(bytes, file.type);
  if (!format) return error("Unsupported or invalid image format", 415);
  try {
    await validatePrivatePartnerImage(bytes, format.mime);
  } catch {
    return error("Image is corrupt, animated, too large, or not a valid PNG, JPEG or WebP", 415);
  }

  try {
    const stored = await storePrivatePartnerImage({
      db: prisma, slug, uploadedBy: editor.userId,
      bytes, declaredType: format.mime,
    });
    return NextResponse.json(stored, {
      status: "uploaded" in stored ? 201 : 200,
      headers: privateHeaders,
    });
  } catch (e) {
    if (e instanceof PartnerImageQuotaExceeded) return error(e.message, 409);
    console.error("Partner appearance image upload failed.");
    return error("Could not store partner image", 500);
  }
}
