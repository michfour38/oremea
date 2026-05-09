import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.oremea.com";

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const email = normalizeEmail(url.searchParams.get("email"));
  const plan = url.searchParams.get("plan")?.trim() || "resonance";

  if (email) {
    try {
      await prisma.entry_leads.upsert({
  where: { email },
  update: {
    journey_paid_at: new Date(),
    journey_access_granted: true,
    pathway: "relate",
  },
  create: {
    email,
    journey_paid_at: new Date(),
    journey_access_granted: true,
    pathway: "relate",
  },
});
    } catch (error) {
      console.error("Journey access grant failed:", error);
    }
  }

  return NextResponse.redirect(
    `${APP_URL}/oremea/begin?payment=success&plan=${plan}${
      email ? `&email=${encodeURIComponent(email)}` : ""
    }`
  );
}