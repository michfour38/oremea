"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function submitPartyQuestion(formData: FormData) {
  const token = clean(formData.get("token"), 64);
  const question = clean(formData.get("question"), 3000);

  if (!UUID_PATTERN.test(token) || !question) {
    redirect("/party/questions?error=details");
  }

  const registration = await prisma.oremea_party_registrations.findUnique({
    where: { questions_token: token },
    select: { id: true },
  });

  if (!registration) {
    redirect("/party/questions?error=access");
  }

  await prisma.oremea_party_questions.create({
    data: {
      registration_id: registration.id,
      question,
    },
  });

  redirect(`/party/questions?token=${encodeURIComponent(token)}&sent=1`);
}
