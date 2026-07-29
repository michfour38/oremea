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
      (email) => email.id === user.primaryEmailAddressId,
    )?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";

  return normalizeEmail(primaryEmail);
}

export async function upsertEntryLead(input: UpsertEntryLeadInput) {
  const email = normalizeEmail(input.email);
  if (!email) return;

  const firstName = input.firstName?.trim() || undefined;
  const source = input.source?.trim() || undefined;

  await prisma.entry_leads.upsert({
    where: { email },
    update: {
      first_name: firstName,
      source,
    },
    create: {
      email,
      first_name: firstName,
      source,
    },
  });
}

export async function grantResonanceAccess(input?: {
  email?: string;
  plan?: string;
}) {
  const fallbackEmail = normalizeEmail(input?.email);
  const signedInEmail = await getSignedInEmail();
  const email = fallbackEmail || signedInEmail || null;

  // Retired deliberately. A payment-return URL may never create blanket
  // Resonance access. Verified week purchases create resonance_week_runs.
  return {
    hasAccess: false,
    email,
    retired: true as const,
  };
}

export async function markIntroCompleted(input?: { email?: string }) {
  const signedInEmail = await getSignedInEmail();
  const fallbackEmail = normalizeEmail(input?.email);
  const email = signedInEmail || fallbackEmail;

  if (!email) return;

  await prisma.entry_leads.updateMany({
    where: { email },
    data: { intro_completed_at: new Date() },
  });
}

export async function getEntryResumeState({
  email,
}: {
  email: string;
}) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return { destination: "enter" as const };
  }

  // The old paid/begin/resonance resume ladder is retired. The authenticated
  // product home decides access from the participant's Resonance runs.
  return { destination: "entry" as const };
}
