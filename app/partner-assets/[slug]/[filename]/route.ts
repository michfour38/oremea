import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isKnownPartner } from "@/src/lib/oremea/partner-appearance-contract";
import { getPartnerAppearanceEditor } from "@/src/lib/oremea/partner-appearance-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ slug: string; filename: string }> };

/**
 * Private uploaded draft artwork. Customers and the public cannot read
 * unpublished uploads. No static files or cross-tenant filesystem paths.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug, filename } = await context.params;
  if (!isKnownPartner(slug) ||
    !/^img-[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(filename)) {
    return new NextResponse(null, { status: 404 });
  }
  const editor = await getPartnerAppearanceEditor(slug);
  if (!editor) return new NextResponse(null, { status: 404 });

  const asset = await prisma.oremea_partner_appearance_assets.findFirst({
    where: { partner_slug: slug, filename },
    select: { file_bytes: true, content_type: true },
  });
  if (!asset) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(asset.file_bytes), {
    status: 200,
    headers: {
      "Content-Type": asset.content_type,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
