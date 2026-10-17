import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  "X-Oremea-Argus": "recognition-v1",
};

function authorised(request: Request) {
  const secret = process.env.DAWN_TRUTH_EXPORT_TOKEN?.trim() || "";
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!secret || !supplied) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Only aggregate response-path evidence. Never export participant messages,
// user IDs, emails, thread IDs, model prompts, or conversation contents.
export async function GET(request: Request) {
  if (!process.env.DAWN_TRUTH_EXPORT_TOKEN?.trim()) {
    return NextResponse.json({ error: "ARGUS_EXPORT_NOT_CONFIGURED" }, { status: 503, headers });
  }
  if (!authorised(request)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers });
  }

  const observedAt = new Date();
  const since = new Date(observedAt.getTime() - 60 * 60 * 1000);
  const where = { role: "assistant", created_at: { gte: since } } as const;
  const [fallbackResponseCount, structuredResponseCount, latestFallback, latestStructured] =
    await Promise.all([
      prisma.recognition_messages.count({
        where: { ...where, evidence_snapshot: { path: ["responseMode"], equals: "fallback" } },
      }),
      prisma.recognition_messages.count({
        where: { ...where, evidence_snapshot: { path: ["responseMode"], equals: "structured" } },
      }),
      prisma.recognition_messages.findFirst({
        where: { ...where, evidence_snapshot: { path: ["responseMode"], equals: "fallback" } },
        orderBy: { created_at: "desc" },
        select: { created_at: true },
      }),
      prisma.recognition_messages.findFirst({
        where: { ...where, evidence_snapshot: { path: ["responseMode"], equals: "structured" } },
        orderBy: { created_at: "desc" },
        select: { created_at: true },
      }),
    ]);

  return NextResponse.json({
    schemaVersion: 1,
    source: "recognition_response_path",
    privacy: "aggregate_no_pii",
    observedAt: observedAt.toISOString(),
    windowMinutes: 60,
    fallbackResponseCount,
    structuredResponseCount,
    latestFallbackAt: latestFallback?.created_at?.toISOString() ?? null,
    latestStructuredAt: latestStructured?.created_at?.toISOString() ?? null,
    note: "A backup reply is a valid response, not automatically a full provider outage.",
  }, { headers });
}
