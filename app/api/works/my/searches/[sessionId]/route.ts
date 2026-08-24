import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to open this WORKS search." }, { status: 401 });

  const search = await prisma.works_search_sessions.findFirst({
    where: { id: params.sessionId, clerk_user_id: userId },
    include: {
      market: { select: { slug: true, name: true } },
      brief: { select: { id: true, product_description: true, status: true } },
    },
  });

  if (!search) return NextResponse.json({ error: "This WORKS search is not available to this account." }, { status: 404 });

  return NextResponse.json({
    search: {
      id: search.id,
      market: search.market,
      currentStep: search.current_step,
      status: search.status,
      brief: search.brief ? {
        id: search.brief.id,
        productDescription: search.brief.product_description,
        status: search.brief.status,
      } : null,
    },
  });
}
