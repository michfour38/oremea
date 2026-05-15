import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

async function getSignedInEmail() {
  const user = await currentUser();

  const primaryEmail =
    user?.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";

  return normalizeEmail(primaryEmail);
}

async function writeUnlock(userId: string, weekNumber: number, dayNumber: number, tier: string) {
  const now = new Date();

  return prisma.mirror_unlocks.upsert({
    where: {
      user_id_week_number_day_number_tier: {
        user_id: userId,
        week_number: weekNumber,
        day_number: dayNumber,
        tier,
      },
    },
    update: {
      is_paid: true,
      unlocked_at: now,
      updated_at: now,
    },
    create: {
      user_id: userId,
      week_number: weekNumber,
      day_number: dayNumber,
      tier,
      is_paid: true,
      unlocked_at: now,
      updated_at: now,
    },
  });
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const signedInEmail = await getSignedInEmail();

    const url = new URL(request.url);
    const weekNumber = Number(url.searchParams.get("weekNumber") ?? "1");
    const dayNumber = Number(url.searchParams.get("dayNumber") ?? "1");
    const tier = String(url.searchParams.get("tier") ?? "full");

    await writeUnlock(userId, weekNumber, dayNumber, tier);

    if (signedInEmail) {
      await prisma.entry_leads.updateMany({
        where: { email: signedInEmail },
        data: {
          pathway: "relate",
          journey_access_granted: true,
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.redirect(new URL("/journey?mirror=success#mirror", request.url));
  } catch (error) {
    console.error("GET /api/mirror/unlock failed:", error);

    return NextResponse.redirect(new URL("/journey?mirror=error", request.url));
  }
}