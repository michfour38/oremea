import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { oremeaProductTruthSnapshot } from "@/src/lib/oremea/product-truth";

export const dynamic = "force-dynamic";

function sameSecret(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const configuredToken = process.env.DAWN_TRUTH_EXPORT_TOKEN?.trim() || "";
  if (!configuredToken) {
    return NextResponse.json(
      { error: "DAWN_TRUTH_EXPORT_NOT_CONFIGURED" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const authorization = request.headers.get("authorization") || "";
  const prefix = "Bearer ";
  const suppliedToken = authorization.startsWith(prefix)
    ? authorization.slice(prefix.length).trim()
    : "";

  if (!suppliedToken || !sameSecret(suppliedToken, configuredToken)) {
    return NextResponse.json(
      { error: "NOT_FOUND" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(oremeaProductTruthSnapshot(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    },
  });
}
