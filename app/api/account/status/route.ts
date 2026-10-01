import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/auth/account-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getAccountAccess(userId);

  return NextResponse.json(
    {
      suspended: access.suspended,
      hasEternalKey: access.hasEternalKey,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
