"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { sendPartyWelcomeEmail } from "@/src/lib/email/send-party-welcome-email";
import { getPartyTopicGroup } from "./topics";

const EVENT_KEY = "what-keeps-repeating-in-connection-1";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function registerForParty(formData: FormData) {
  const firstName = clean(formData.get("firstName"), 120);
  const email = clean(formData.get("email"), 254).toLowerCase();
  const topicCategory = clean(formData.get("topicCategory"), 80);
  const topicSelection = clean(formData.get("topicSelection"), 500);
  const topicOther = clean(formData.get("topicOther"), 1000);
  const invitedByRaw = clean(formData.get("invitedBy"), 64);
  const guestPassRaw = clean(formData.get("guestPass"), 64);

  const topicGroup = getPartyTopicGroup(topicCategory);
  const isListedSelection = Boolean(
    topicGroup?.options.some((option) => option.label === topicSelection),
  );
  const isOtherSelection =
    topicSelection === "Neither — my version is different" && topicOther.length > 0;

  if (!EMAIL_PATTERN.test(email) || !topicGroup || (!isListedSelection && !isOtherSelection)) {
    redirect("/party?error=details");
  }

  const question = isOtherSelection
    ? `${topicGroup.question} — My version: ${topicOther}`
    : `${topicGroup.question} — ${topicSelection}`;

  let invitedBy: string | null = null;
  let guestPass:
    | { id: string; owner_registration_id: string }
    | null = null;

  if (UUID_PATTERN.test(guestPassRaw)) {
    guestPass = await prisma.oremea_party_guest_passes.findFirst({
      where: {
        event_key: EVENT_KEY,
        token: guestPassRaw,
        claimed_at: null,
      },
      select: {
        id: true,
        owner_registration_id: true,
      },
    });

    if (guestPass) {
      const inviter = await prisma.oremea_party_registrations.findUnique({
        where: { id: guestPass.owner_registration_id },
        select: { referral_code: true },
      });
      invitedBy = inviter?.referral_code ?? null;
    }
  } else if (UUID_PATTERN.test(invitedByRaw)) {
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
          topic_category: topicCategory,
          topic_selection: topicSelection,
          topic_other: isOtherSelection ? topicOther : null,
          invited_by: existing.invited_by ?? invitedBy,
        },
      })
    : await prisma.oremea_party_registrations.create({
        data: {
          event_key: EVENT_KEY,
          email,
          first_name: firstName || null,
          question,
          topic_category: topicCategory,
          topic_selection: topicSelection,
          topic_other: isOtherSelection ? topicOther : null,
          referral_code: randomUUID(),
          questions_token: randomUUID(),
          invited_by: invitedBy,
        },
      });

  if (guestPass && guestPass.owner_registration_id !== registration.id) {
    await prisma.oremea_party_guest_passes.updateMany({
      where: {
        id: guestPass.id,
        claimed_at: null,
      },
      data: {
        claimed_by_registration_id: registration.id,
        claimed_at: new Date(),
      },
    });
  }

  const passes = await Promise.all(
    [1, 2].map((slot) =>
      prisma.oremea_party_guest_passes.upsert({
        where: {
          owner_registration_id_slot: {
            owner_registration_id: registration.id,
            slot,
          },
        },
        update: {},
        create: {
          event_key: EVENT_KEY,
          owner_registration_id: registration.id,
          slot,
          token: randomUUID(),
        },
        select: {
          slot: true,
          token: true,
        },
      }),
    ),
  );

  await sendPartyWelcomeEmail({
    to: registration.email,
    firstName: registration.first_name,
    questionsToken: registration.questions_token,
    guestPassTokens: passes
      .sort((a, b) => a.slot - b.slot)
      .map((pass) => pass.token),
  });

  redirect(`/party?registered=${registration.referral_code}`);
}
