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
  const staleBefore = new Date(observedAt.getTime() - 3 * 60 * 1000);
  const where = { role: "assistant", created_at: { gte: since } } as const;
  const [fallbackResponseCount, structuredResponseCount, latestFallback, latestStructured, pendingRows] =
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
      // Thread turns alternate user/assistant. An odd message count with no
      // assistant after three minutes is a stalled saved turn, regardless of age.
      // Old unresolved turns must not disappear simply because time passes.
      // Aggregate only;
      // do not export identities or original language.
      prisma.$queryRaw<Array<{ pending_count: bigint; latest_pending_at: Date | null }>>`
        SELECT COUNT(*)::bigint AS pending_count,
               MAX(last_message_at) AS latest_pending_at
        FROM recognition_threads
        WHERE status = 'active'
          AND (message_count % 2) = 1
          AND last_message_at < ${staleBefore}
      `,
    ]);
  const pendingSavedTurnCount = Number(pendingRows[0]?.pending_count ?? 0);
  const latestPendingAt = pendingRows[0]?.latest_pending_at?.toISOString() ?? null;

  return NextResponse.json({
    schemaVersion: 1,
    source: "recognition_response_path",
    privacy: "aggregate_no_pii",
    observedAt: observedAt.toISOString(),
    windowMinutes: 60,
    fallbackResponseCount,
    structuredResponseCount,
    pendingSavedTurnCount,
    latestPendingAt,
    pendingScope: "all_active_stalled_turns",
    latestFallbackAt: latestFallback?.created_at?.toISOString() ?? null,
    latestStructuredAt: latestStructured?.created_at?.toISOString() ?? null,
    note: "Response-mode counts cover one hour; stalled saved turns include all active unresolved turns older than three minutes. Neither signal alone proves a provider-wide outage.",
  }, { headers });
}
