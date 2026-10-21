import { logPrivateError } from "@/src/lib/security/private-errors";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Not signed in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const weekNumber = Number(body.weekNumber);
    const dayNumber = Number(body.dayNumber);
    const feedback = String(body.feedback ?? "").trim();
    const note = String(body.note ?? "").trim();

    if (
      !weekNumber ||
      !dayNumber ||
      !["yes", "not_quite"].includes(feedback)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid feedback payload." },
        { status: 400 }
      );
    }

    const row = await prisma.mirror_feedback.upsert({
      where: {
        user_id_week_number_day_number: {
          user_id: userId,
          week_number: weekNumber,
          day_number: dayNumber,
        },
      },
      update: {
        feedback,
        note: feedback === "not_quite" ? note || null : null,
      },
      create: {
        user_id: userId,
        week_number: weekNumber,
        day_number: dayNumber,
        feedback,
        note: feedback === "not_quite" ? note || null : null,
      },
    });

    return NextResponse.json({ ok: true, row });
  } catch (error) {
    logPrivateError("POST /api/mirror/feedback failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to save feedback.",
      },
      { status: 500 }
    );
  }
}