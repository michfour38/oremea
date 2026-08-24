import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const reviewId = body.reviewId

    if (!reviewId) {
      return NextResponse.json({ error: "Missing reviewId" }, { status: 400 })
    }

    const review = await prisma.harmonize_share_reviews.findUnique({
      where: { id: reviewId },
      include: {
        entries: {
          include: {
            cycles: {
              include: {
                systems: {
                  include: { participants: true },
                },
              },
            },
          },
        },
      },
    })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    const participant = review.entries.cycles.systems.participants.find(
      (p) => p.profile_id === userId && p.active,
    )

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this cycle" },
        { status: 403 },
      )
    }

    const updatedReview = await prisma.harmonize_share_reviews.update({
      where: { id: reviewId },
      data: {
        approved: true,
        reviewed_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      review: updatedReview,
    })
  } catch (error) {
    console.error("POST /api/harmonize/share-review/approve failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to approve share review" },
      { status: 500 },
    )
  }
}