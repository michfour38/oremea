"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type UpsertEntryLeadInput = {
  email: string;
  firstName?: string;
  source?: string;
};

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

export async function upsertEntryLead(input: UpsertEntryLeadInput) {
  const email = normalizeEmail(input.email);
  const firstName = input.firstName?.trim() || undefined;
  const source = input.source?.trim() || undefined;

  if (!email) return;

  await prisma.entry_leads.upsert({
    where: { email },
    update: {
      first_name: firstName,
      source,
      pathway: "discover",
    },
    create: {
      email,
      first_name: firstName,
      source,
      pathway: "discover",
    },
  });
}

export async function grantJourneyAccess(input?: { email?: string; plan?: string }) {
  const fallbackEmail = normalizeEmail(input?.email);
  const signedInEmail = await getSignedInEmail();

  // IMPORTANT:
  // Payment success must attach to the payment email first.
  // Only fall back to Clerk email if no payment email was passed.
  const email = fallbackEmail || signedInEmail;

  if (!email) {
    return {
      hasAccess: false,
      email: null as string | null,
    };
  }

  await prisma.entry_leads.upsert({
  where: { email },
  update: {
    journey_access_granted: true,
    journey_paid_at: new Date(),
    pathway: input?.plan === "mirror" ? "relate" : "discover",
  },
  create: {
    email,
    journey_access_granted: true,
    journey_paid_at: new Date(),
    pathway: input?.plan === "mirror" ? "relate" : "discover",
  },
});

  return {
    hasAccess: true,
    email,
  };
}

export async function markIntroCompleted(input?: { email?: string }) {
  const signedInEmail = await getSignedInEmail();
  const fallbackEmail = normalizeEmail(input?.email);
  const email = signedInEmail || fallbackEmail;

  if (!email) return;

  await prisma.entry_leads.update({
    where: { email },
    data: {
      intro_completed_at: new Date(),
    },
  });
}

export async function getEntryResumeState({
  email,
}: {
  email: string;
}) {
  if (!email) {
    return { destination: "enter" as const };
  }

  const lead = await prisma.entry_leads.findUnique({
    where: { email },
  });

  // ❌ No record → treat as new
  if (!lead) {
    return { destination: "enter" as const };
  }

  // ❌ Not paid yet
  if (!lead.journey_access_granted) {
    return { destination: "enter" as const };
  }

  // 🔥 Paid but NOT completed /begin
  if (!lead.intro_completed_at) {
    return { destination: "begin" as const };
  }

  // ✅ Paid + completed /begin
  return { destination: "journey" as const };
}