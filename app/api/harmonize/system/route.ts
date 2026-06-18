import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_MODES = [
  "couple",
  "family_adults",
  "team",
  "parallel_parenting_adults",
] as const;

export async function POST(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    if (!ALLOWED_MODES.includes(body.mode)) {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 },
      );
    }

    const system = await prisma.harmonize_systems.create({
  data: {
    mode: body.mode,
    created_by: userId,
    status: "active",
    consent_snapshot: body.consentSnapshot || {},
  },
});

    await prisma.harmonize_participants.create({
      data: {
        system_id: system.id,
        profile_id: userId,
        role:
          body.mode === "team"
            ? "team_lead"
            : body.mode === "parallel_parenting_adults"
            ? "parent"
            : "partner",
      },
    });

    return NextResponse.json({
      success: true,
      system,
    });
  } catch (error) {
    console.error(
      "POST /api/harmonize/system failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create system",
      },
      { status: 500 },
    );
  }
}