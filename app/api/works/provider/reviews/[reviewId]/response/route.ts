import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function cleanResponse(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 2000);
}

export async function PATCH(request: Request, { params }: { params: { reviewId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to respond to reviews." }, { status: 401 });

  const review = await prisma.works_provider_reviews.findUnique({
    where: { id: params.reviewId },
    select: { id: true, provider_id: true, status: true },
  });
  if (!review || review.status !== "PUBLISHED") {
    return NextResponse.json({ error: "This published review is not available." }, { status: 404 });
  }

  const membership = await prisma.works_provider_memberships.findFirst({
    where: { provider_id: review.provider_id, clerk_user_id: userId, active: true },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "This review is not available to your provider account." }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const response = cleanResponse(body?.response);

  const updated = await prisma.works_provider_reviews.update({
    where: { id: review.id },
    data: {
      provider_response: response,
      provider_replied_at: response ? new Date() : null,
    },
    select: { id: true, provider_response: true, provider_replied_at: true },
  });

  return NextResponse.json({ review: updated });
}
