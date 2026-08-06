import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyResonanceSeed } from "@/prisma/scripts/resonance-verify-lib";
import { seedAllResonance } from "@/prisma/seeds/resonance-seed-lib";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXPECTED_TOKEN_HASH =
  "4e0f1e0fdd56d81dcd96dc2ea5aff09bfd86c54441d37cb846a5a8a1747dc519";

function tokenIsValid(token: string | null) {
  if (!token) return false;

  const received = Buffer.from(
    createHash("sha256").update(token).digest("hex"),
    "utf8",
  );
  const expected = Buffer.from(EXPECTED_TOKEN_HASH, "utf8");

  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!tokenIsValid(token)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    await seedAllResonance(prisma);
    const verification = await verifyResonanceSeed(prisma);

    return NextResponse.json({
      ok: true,
      expectedPromptCount: verification.expectedPromptCount,
      activePromptCount: verification.activePromptCount,
      rooms: verification.roomSummaries,
    });
  } catch (error) {
    console.error("One-time Resonance production seed failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown seed error",
      },
      { status: 500 },
    );
  }
}
