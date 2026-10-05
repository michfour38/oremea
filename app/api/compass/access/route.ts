import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { activateCreatorSilverProduct } from "@/lib/auth/creator-silver-key";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  // This endpoint is called when the member enters Compass. Creator Silver
  // access starts here, not when the key is issued or claimed.
  await activateCreatorSilverProduct(userId, "compass");
  const access = await getCompassAccessState(userId);

  return NextResponse.json({
    active: access.active,
    expiresAt: access.expiresAt?.toISOString() ?? null,
    daysRemaining: access.daysRemaining,
    source: access.source,
  });
}
