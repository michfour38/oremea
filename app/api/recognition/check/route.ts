import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REFINEMENT_WINDOW_MS = 4 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required." },
        { status: 400 },
      );
    }

    const lead = await prisma.entry_leads.findUnique({
      where: { email },
      select: {
        entry_mirror_sessions: {
          orderBy: { created_at: "desc" },
          select: {
            completed_at: true,
            mirror_generated_at: true,
            entry_mirror_outputs: {
              select: { id: true },
            },
          },
        },
      },
    });

    const sessions = lead?.entry_mirror_sessions ?? [];
    const outputCount = sessions.reduce(
      (total, session) => total + session.entry_mirror_outputs.length,
      0,
    );
    const latestSession = sessions[0] ?? null;
    const lastCompletedAt =
      latestSession?.completed_at ?? latestSession?.mirror_generated_at ?? null;
    const refinementAvailable = Boolean(
      latestSession &&
        latestSession.entry_mirror_outputs.length === 1 &&
        lastCompletedAt &&
        Date.now() - lastCompletedAt.getTime() <= REFINEMENT_WINDOW_MS,
    );

    return NextResponse.json({
      alreadyCompleted: false,
      hasPreviousRecognition: outputCount > 0,
      refinementAvailable,
    });
  } catch (error) {
    console.error("Recognition check failed:", error);

    return NextResponse.json(
      { error: "Could not check Recognition status." },
      { status: 500 },
    );
  }
}
