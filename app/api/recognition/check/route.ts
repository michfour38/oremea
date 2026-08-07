import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
          select: {
            entry_mirror_outputs: {
              select: { id: true },
            },
          },
        },
      },
    });

    const outputCount =
      lead?.entry_mirror_sessions.reduce(
        (total, session) => total + session.entry_mirror_outputs.length,
        0,
      ) ?? 0;

    return NextResponse.json({
      alreadyCompleted: false,
      hasPreviousRecognition: outputCount > 0,
    });
  } catch (error) {
    console.error("Recognition check failed:", error);

    return NextResponse.json(
      { error: "Could not check Recognition status." },
      { status: 500 },
    );
  }
}
