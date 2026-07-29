import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown) {
  const cleaned = stringValue(value);
  return cleaned || undefined;
}

function optionalPositiveNumber(value: unknown) {
  if (value === "" || value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

const DECISIONS = new Set(["YES", "POSSIBLE", "OUTSIDE_CAPABILITY"]);

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const tokenHash = hashToken(params.token);
    const body = await req.json();
    const decision = stringValue(body?.decision).toUpperCase();

    if (!DECISIONS.has(decision)) {
      return NextResponse.json({ error: "Choose how this brief fits your capability." }, { status: 400 });
    }

    const outreach = await prisma.works_provider_outreach.findUnique({
      where: { response_token_hash: tokenHash },
      select: { id: true, brief_id: true },
    });

    if (!outreach) {
      return NextResponse.json({ error: "This WORKS response link is no longer valid." }, { status: 404 });
    }

    const capacityDateValue = optionalString(body?.capacityDate);
    const capacityDate = capacityDateValue ? new Date(`${capacityDateValue}T00:00:00.000Z`) : undefined;

    await prisma.works_provider_outreach.update({
      where: { id: outreach.id },
      data: {
        decision: decision as never,
        status: decision === "OUTSIDE_CAPABILITY" ? "DECLINED" : "RESPONDED",
        responded_at: new Date(),
        moq_value: optionalPositiveNumber(body?.moqValue),
        moq_unit: optionalString(body?.moqUnit),
        lead_time_text: optionalString(body?.leadTime),
        capacity_date: capacityDate,
        pricing_notes: optionalString(body?.pricingNotes),
        certification_notes: optionalString(body?.certificationNotes),
        provider_notes: optionalString(body?.providerNotes),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Your response has been added to this WORKS production brief.",
    });
  } catch (error) {
    console.error("WORKS provider response failed:", error);
    return NextResponse.json(
      { error: "WORKS could not save this response yet." },
      { status: 500 }
    );
  }
}
