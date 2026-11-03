import { NextResponse } from "next/server";
import {
  getReleasedPartnerAsset,
} from "@/src/lib/oremea/partner-appearance-release-server";
import {
  validReleasedMediaFilename,
} from "@/src/lib/oremea/partner-appearance-release-contract";
import { isKnownPartner } from "@/src/lib/oremea/partner-appearance-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string; filename: string }> };

/** Only sanitized, currently approved, actively referenced media are public. */
export async function GET(_request: Request, { params }: Params) {
  const { slug, filename } = await params;
  if (!isKnownPartner(slug) || !validReleasedMediaFilename(filename)) {
    return new NextResponse(null, { status: 404 });
  }
  const asset = await getReleasedPartnerAsset(slug, filename);
  if (!asset) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(asset.file_bytes), {
    headers: {
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
