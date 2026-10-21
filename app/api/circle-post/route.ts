import { logPrivateError } from "@/src/lib/security/private-errors";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { detectAutoFlags } from "@/lib/moderation/auto-flag";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "circle-post",
    method: "GET",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    let profile = await prisma.profiles.findFirst({
      where: { id: userId },
      select: { id: true },
    });

    if (!profile) {
      profile = await prisma.profiles.create({
        data: {
          id: userId,
          display_name: "New User",
          pathway: "discover",
          updated_at: new Date(),
        },
        select: { id: true },
      });
    }

    const circle = await prisma.circles.findFirst({
      select: { id: true },
    });

    if (!circle) {
      return NextResponse.json(
        { error: "No circle exists yet" },
        { status: 404 }
      );
    }

    const autoFlag = detectAutoFlags(content);

    let riskScore = autoFlag.score;

    if (autoFlag.severity === "HIGH") {
      riskScore += 20;
    } else if (autoFlag.severity === "MEDIUM") {
      riskScore += 10;
    }

    riskScore = Math.min(riskScore, 100);

    const post = await prisma.circle_posts.create({
      data: {
        content,
        circle_id: circle.id,
        user_id: profile.id,
        risk_score: riskScore,
        severity: autoFlag.severity,
        categories: autoFlag.categories,
        updated_at: new Date(),
      },
    });

    if (riskScore >= 40) {
      await prisma.reports.create({
        data: {
          reporter_id: profile.id,
          reported_post_id: post.id,
          reason: `SYSTEM_AUTO_FLAG: severity=${autoFlag.severity}; score=${autoFlag.score}; risk=${riskScore}; categories=${autoFlag.categories.join(",")}; terms=${autoFlag.matches
            .map((m) => m.term)
            .join(",")}`,
          status: "pending",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      post,
      autoFlag,
      riskScore,
      flagged: riskScore >= 40,
    });
  } catch (error) {
    logPrivateError("circle-post POST error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to save the post.",
      },
      { status: 500 }
    );
  }
}