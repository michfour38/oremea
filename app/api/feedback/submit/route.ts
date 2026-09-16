import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_CATEGORIES = new Set([
  "contact",
  "completion",
  // Kept temporarily for compatibility with any older deployed feedback form.
  "witness_missed",
  "felt_wrong",
  "unclear",
  "broken",
  "suggestion",
  "other",
]);

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function score1to5(value: unknown) {
  const score = Number(value);
  return Number.isInteger(score) && score >= 1 && score <= 5 ? score : null;
}

function score0to10(value: unknown) {
  const score = Number(value);
  return Number.isInteger(score) && score >= 0 && score <= 10 ? score : null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();

    const name = clean(body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const product = clean(body.product, 140) || "Oremea generally";
    const category = clean(body.category, 40);
    const message = clean(body.message, 5000);
    const whatChanged = clean(body.whatChanged, 5000);
    const mostUseful = clean(body.mostUseful, 5000);
    const improvement = clean(body.improvement, 5000);
    const anythingElse = clean(body.anythingElse, 5000);
    const source = clean(body.source, 500);
    const website = clean(body.website, 250);
    const replyRequested = body.replyRequested === true;
    const beforeClarity = score1to5(body.beforeClarity);
    const afterClarity = score1to5(body.afterClarity);
    const fitScore = score1to5(body.fitScore);
    const recommendScore = score0to10(body.recommendScore);

    // Honeypot: accept bot submissions without saving anything.
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json(
        { success: false, error: "This message could not be saved." },
        { status: 400 },
      );
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: "Add a valid email address or leave it blank." },
        { status: 400 },
      );
    }

    if (replyRequested && !email) {
      return NextResponse.json(
        { success: false, error: "Add an email address if you would like a reply." },
        { status: 400 },
      );
    }

    if (category === "completion") {
      if (
        beforeClarity === null ||
        afterClarity === null ||
        fitScore === null ||
        recommendScore === null
      ) {
        return NextResponse.json(
          { success: false, error: "Complete the survey scores before saving." },
          { status: 400 },
        );
      }
    } else if (!message) {
      return NextResponse.json(
        { success: false, error: "Write a message before saving." },
        { status: 400 },
      );
    }

    await prisma.oremea_feedback_messages.create({
      data: {
        user_id: userId || null,
        category,
        product,
        message: message || null,
        name: name || null,
        email: email || null,
        reply_requested: replyRequested,
        source: source || null,
        before_clarity: beforeClarity,
        after_clarity: afterClarity,
        fit_score: fitScore,
        recommend_score: recommendScore,
        what_changed: whatChanged || null,
        most_useful: mostUseful || null,
        improvement: improvement || null,
        anything_else: anythingElse || null,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        category === "completion"
          ? "Thank you. Your survey was saved privately."
          : "Saved privately.",
    });
  } catch (error) {
    console.error("Feedback save failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Your message could not be saved yet. Please try again.",
      },
      { status: 500 },
    );
  }
}
