import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getCompassAccessState } from "@/src/lib/compass/compass-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  const access = await getCompassAccessState(userId);

  return NextResponse.json({
    active: access.active,
    expiresAt: access.expiresAt?.toISOString() ?? null,
    daysRemaining: access.daysRemaining,
  });
}
