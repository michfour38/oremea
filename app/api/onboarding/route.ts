import { logPrivateError } from "@/src/lib/security/private-errors";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { displayName, pathway } = body;

    await prisma.profiles.upsert({
      where: { id: userId },
      update: {
        display_name: displayName,
        pathway,
        onboarding_done: true,
      },
      create: {
        id: userId,
        display_name: displayName,
        pathway,
        onboarding_done: true,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logPrivateError("app/api/onboarding/route.ts:34", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}