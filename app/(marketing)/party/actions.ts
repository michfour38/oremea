"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const EVENT_KEY = "what-keeps-repeating-in-connection-1";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function registerForParty(formData: FormData) {
  const firstName = clean(formData.get("firstName"), 120);
  const email = clean(formData.get("email"), 254).toLowerCase();
  const question = clean(formData.get("question"), 3000);
  const invitedByRaw = clean(formData.get("invitedBy"), 64);

  if (!EMAIL_PATTERN.test(email) || !question) {
    redirect("/party?error=details");
  }

  let invitedBy: string | null = null;
  const invitedByIsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invitedByRaw);
  if (invitedByIsUuid) {
    const inviter = await prisma.oremea_party_registrations.findFirst({
      where: {
        event_key: EVENT_KEY,
        referral_code: invitedByRaw,
      },
      select: { referral_code: true },
    });
    invitedBy = inviter?.referral_code ?? null;
  }

  const existing = await prisma.oremea_party_registrations.findUnique({
    where: {
      event_key_email: {
        event_key: EVENT_KEY,
        email,
      },
    },
  });

  const registration = existing
    ? await prisma.oremea_party_registrations.update({
        where: { id: existing.id },
        data: {
          first_name: firstName || existing.first_name,
          question,
          invited_by: existing.invited_by ?? invitedBy,
        },
      })
    : await prisma.oremea_party_registrations.create({
        data: {
          event_key: EVENT_KEY,
          email,
          first_name: firstName || null,
          question,
          referral_code: randomUUID(),
          invited_by: invitedBy,
        },
      });

  redirect(`/party?registered=${registration.referral_code}`);
}
