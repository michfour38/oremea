import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { activateCreatorSilverProduct } from "@/lib/auth/creator-silver-key";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  // Compass itself uses the default access check and starts a Silver window.
  // Shared navigation uses ?peek=1 so merely rendering another product never
  // burns any of the creator's 30 Compass days.
  const peekOnly = request.nextUrl.searchParams.get("peek") === "1";
  if (!peekOnly) {
    await activateCreatorSilverProduct(userId, "compass");
  }

  const access = await getCompassAccessState(userId);

  return NextResponse.json({
    active: access.active,
    expiresAt: access.expiresAt?.toISOString() ?? null,
    daysRemaining: access.daysRemaining,
    source: access.source,
  });
}
