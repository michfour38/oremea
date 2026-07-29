import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to open My WORKS." }, { status: 401 });
  }

  const searches = await prisma.works_search_sessions.findMany({
    where: { clerk_user_id: userId },
    orderBy: { updated_at: "desc" },
    take: 100,
    include: {
      market: { select: { slug: true, name: true } },
      brief: { select: { id: true, product_description: true, status: true } },
      procurement_request: { select: { status: true, created_at: true } },
    },
  });

  return NextResponse.json({
    searches: searches.map((search) => ({
      id: search.id,
      status: search.status,
      currentStep: search.current_step,
      updatedAt: search.updated_at,
      market: search.market,
      brief: search.brief
        ? {
            id: search.brief.id,
            productDescription: search.brief.product_description,
            status: search.brief.status,
          }
        : null,
      sourcingStatus: search.procurement_request?.status ?? null,
    })),
  });
}