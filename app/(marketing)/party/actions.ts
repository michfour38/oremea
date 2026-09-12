"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

const EVENT_KEY = "what-keeps-repeating-in-connection-1";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_GUEST_INVITATIONS = 2;

function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function partyOrigin() {
  return (
    process.env.NEXT_PUBLIC_OREMEA_PARTY_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://www.oremea.com"
  ).replace(/\/$/, "");
}

function ticketCode(id: string) {
  return `ORE-${id.split("-")[0].toUpperCase()}`;
}

async function sendPartyTicketEmail(registration: {
  id: string;
  email: string;
  first_name: string | null;
  referral_code: string;
  invite_allowance: number;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("RESEND_API_KEY is missing. Party ticket email was not sent.");
    return;
  }

  const origin = partyOrigin();
  const confirmationUrl = `${origin}/party?registered=${encodeURIComponent(registration.id)}`;
  const inviteUrl = `${origin}/party?ref=${encodeURIComponent(registration.referral_code)}`;
  const startLabel = process.env.OREMEA_PARTY_START_LABEL?.trim();
  const joinUrl = process.env.OREMEA_PARTY_JOIN_URL?.trim();
  const greeting = registration.first_name ? `Howzit ${registration.first_name},` : "Howzit,";
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Oremea <website@oremea.com>";

  const lines = [
    greeting,
    "",
    "Your place is reserved for What Keeps Repeating in Connection?",
    "",
    `Ticket: ${ticketCode(registration.id)}`,
    startLabel ? `Live: ${startLabel}` : "Live details will be sent to this email before the session.",
    "",
    "Private reflection. Live teaching. No requirement to disclose personal details publicly.",
    "",
    joinUrl ? `Join the live session: ${joinUrl}` : "",
    `View your ticket: ${confirmationUrl}`,
    "",
    registration.invite_allowance > 0 ? "You also have two guest invitations." : "",
    registration.invite_allowance > 0 ? `Invite link: ${inviteUrl}` : "",
  ].filter(Boolean);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: registration.email,
    subject: "Your Oremea live-session ticket is reserved",
    text: lines.join("\n"),
    html: `
      <div style="background:#080704;color:#f4f4f5;padding:32px;font-family:Arial,sans-serif;line-height:1.65">
        <div style="max-width:640px;margin:0 auto">
          <p style="color:#c8a96a;letter-spacing:.14em;text-transform:uppercase;font-size:12px">Oremea live session</p>
          <h1 style="font-weight:400;font-size:32px;margin:12px 0 16px">What Keeps Repeating in Connection?</h1>
          <p>${greeting}</p>
          <p>Your place is reserved.</p>
          <div style="border:1px solid rgba(200,169,106,.45);border-radius:20px;padding:22px;margin:24px 0;background:#15120c">
            <p style="margin:0;color:#c8a96a;font-size:12px;text-transform:uppercase;letter-spacing:.14em">Admission · 1</p>
            <p style="font-size:24px;margin:8px 0">${ticketCode(registration.id)}</p>
            <p style="margin:0;color:#d4d4d8">${startLabel || "Live details will be sent by email before the session."}</p>
          </div>
          <p>Private reflection. Live teaching. No requirement to disclose personal details publicly.</p>
          ${joinUrl ? `<p><a href="${joinUrl}" style="color:#f1dfb4">Join the live session</a></p>` : ""}
          <p><a href="${confirmationUrl}" style="color:#f1dfb4">View your ticket</a></p>
          <hr style="border:0;border-top:1px solid #27272a;margin:28px 0" />
${registration.invite_allowance > 0
  ? `<h2 style="font-weight:400">Two guest invitations are included.</h2>
     <p>If two people come immediately to mind who would genuinely use this conversation, send them this invitation link:</p>
     <p><a href="${inviteUrl}" style="color:#f1dfb4">${inviteUrl}</a></p>`
  : ""}
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Party ticket email failed:", error);
  }
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
  if (UUID_PATTERN.test(invitedByRaw)) {
    const inviter = await prisma.oremea_party_registrations.findFirst({
      where: {
        event_key: EVENT_KEY,
        referral_code: invitedByRaw,
      },
      select: { referral_code: true, invite_allowance: true },
    });

    if (inviter) {
      const usedInvitations = await prisma.oremea_party_registrations.count({
        where: {
          event_key: EVENT_KEY,
          invited_by: inviter.referral_code,
        },
      });
      if (usedInvitations < inviter.invite_allowance) {
        invitedBy = inviter.referral_code;
      }
    }
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
          invited_by: existing.invited_by,
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
          invite_allowance: invitedBy ? 0 : MAX_GUEST_INVITATIONS,
        },
      });

  await sendPartyTicketEmail(registration).catch((error) => {
    console.error("Party ticket email could not be sent:", error);
  });

  redirect(`/party?registered=${registration.id}`);
}
