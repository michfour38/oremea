import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { oremeaDawnTruthSnapshot } from "@/src/lib/oremea/dawn-truth";

export const dynamic = "force-dynamic";

const ROUTE_HEADER = { "X-Oremea-Dawn-Truth": "v2" } as const;

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
      { status: 503, headers: { "Cache-Control": "no-store", ...ROUTE_HEADER } },
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
      { status: 404, headers: { "Cache-Control": "no-store", ...ROUTE_HEADER } },
    );
  }

  return NextResponse.json(await oremeaDawnTruthSnapshot(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      ...ROUTE_HEADER,
    },
  });
}
