import { auth } from "@clerk/nextjs/server";
import { WorksProviderOutreachStatus, WorksProviderReviewStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const REVIEWABLE_OUTREACH = new Set<WorksProviderOutreachStatus>([
  WorksProviderOutreachStatus.RESPONDED,
  WorksProviderOutreachStatus.DECLINED,
]);

async function ownedOutreach(outreachId: string, userId: string) {
  const outreach = await prisma.works_provider_outreach.findUnique({
    where: { id: outreachId },
    include: {
      provider: { select: { id: true, name: true, slug: true } },
      brief: {
        select: {
          id: true,
          product_description: true,
          search_session: { select: { clerk_user_id: true } },
        },
      },
      review: true,
    },
  });

  if (!outreach || outreach.brief.search_session?.clerk_user_id !== userId) return null;
  return outreach;
}

export async function GET(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to review a WORKS provider." }, { status: 401 });

  const outreachId = new URL(request.url).searchParams.get("outreachId");
  if (!outreachId) return NextResponse.json({ error: "Choose a provider interaction to review." }, { status: 400 });

  const outreach = await ownedOutreach(outreachId, userId);
  if (!outreach) return NextResponse.json({ error: "This WORKS interaction is not available to this account." }, { status: 404 });

  return NextResponse.json({
    reviewable: REVIEWABLE_OUTREACH.has(outreach.status),
    outreachStatus: outreach.status,
    decision: outreach.decision,
    provider: outreach.provider,
    brief: { id: outreach.brief.id, productDescription: outreach.brief.product_description },
    review: outreach.review
      ? {
          id: outreach.review.id,
          rating: outreach.review.rating,
          body: outreach.review.body,
          reviewerName: outreach.review.reviewer_name,
          reviewerCompany: outreach.review.reviewer_company,
          publicIdentity: outreach.review.public_identity,
          status: outreach.review.status,
          verifiedBrief: outreach.review.verified_brief,
        }
      : null,
  });
}

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to review a WORKS provider." }, { status: 401 });

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const outreachId = typeof payload?.outreachId === "string" ? payload.outreachId : null;
  const rating = typeof payload?.rating === "number" ? Math.trunc(payload.rating) : Number(payload?.rating);
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";
  const requestedPublicIdentity = payload?.publicIdentity === true;
  const reviewerName = typeof payload?.reviewerName === "string" && payload.reviewerName.trim() ? payload.reviewerName.trim() : null;
  const reviewerCompany = typeof payload?.reviewerCompany === "string" && payload.reviewerCompany.trim() ? payload.reviewerCompany.trim() : null;

  if (!outreachId) return NextResponse.json({ error: "Choose a provider interaction to review." }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });
  if (body.length < 10 || body.length > 2000) return NextResponse.json({ error: "Write between 10 and 2,000 characters about your experience." }, { status: 400 });

  const outreach = await ownedOutreach(outreachId, userId);
  if (!outreach) return NextResponse.json({ error: "This WORKS interaction is not available to this account." }, { status: 404 });
  if (!REVIEWABLE_OUTREACH.has(outreach.status)) {
    return NextResponse.json({ error: "A review becomes available after the provider has responded to the WORKS brief." }, { status: 409 });
  }

  const publicIdentity = requestedPublicIdentity && Boolean(reviewerName);

  const review = await prisma.works_provider_reviews.upsert({
    where: { outreach_id: outreach.id },
    create: {
      provider_id: outreach.provider_id,
      brief_id: outreach.brief_id,
      outreach_id: outreach.id,
      reviewer_clerk_id: userId,
      reviewer_name: reviewerName,
      reviewer_company: reviewerCompany,
      public_identity: publicIdentity,
      rating,
      body,
      verified_brief: true,
      status: WorksProviderReviewStatus.PENDING,
    },
    update: {
      reviewer_clerk_id: userId,
      reviewer_name: reviewerName,
      reviewer_company: reviewerCompany,
      public_identity: publicIdentity,
      rating,
      body,
      verified_brief: true,
      status: WorksProviderReviewStatus.PENDING,
    },
  });

  return NextResponse.json({
    review: { id: review.id, status: review.status, verifiedBrief: review.verified_brief },
    message: "Thanks. Your review is saved and will appear after WORKS moderation.",
  });
}