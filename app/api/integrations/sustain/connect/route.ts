import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  hasSustainProductAccess,
  isSustainProduct,
  redeemSustainPairing,
} from "@/src/lib/integrations/sustain-bridge";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers });
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let validOrigin = false;
  try {
    const parsed = new URL(origin ?? "");
    validOrigin = parsed.protocol === "https:" && Boolean(host) && parsed.host === host;
  } catch {
    validOrigin = false;
  }
  if (!validOrigin)
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403, headers });

  const body = await request.json().catch(() => null);
  if (!body || body.confirmed !== true || !isSustainProduct(body.product) ||
      typeof body.code !== "string" || !/^[a-f0-9]{64}$/.test(body.code)) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400, headers });
  }
  const user = await currentUser();
  const emails = user?.emailAddresses.map(item => item.emailAddress.trim().toLowerCase()).filter(Boolean) ?? [];
  if (!(await hasSustainProductAccess(userId, body.product, emails))) {
    return NextResponse.json({ ok: false, error: "product_access_required" }, { status: 403, headers });
  }
  const connected = await redeemSustainPairing(userId, body.product, body.code);
  if (!connected) return NextResponse.json({ ok: false, error: "connection_unavailable" }, { status: 409, headers });
  return NextResponse.json({ ok: true, connected: true, product: body.product }, { headers });
}
