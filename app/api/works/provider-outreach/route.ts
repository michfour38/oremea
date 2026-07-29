import { createHash, randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { buildProviderBrief } from "@/lib/works/outreach/build-provider-brief";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function quantityText(snapshot: Awaited<ReturnType<typeof buildProviderBrief>>) {
  const target = snapshot.quantity.target;
  const unit = snapshot.quantity.unit;
  if (target == null || !unit) return "Quantity details are included in the full brief.";
  return `${target} ${unit.toLowerCase().replaceAll("_", " ")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const briefId = stringValue(body?.briefId);
    const searchSessionId = stringValue(body?.searchSessionId);
    const providerIds = Array.from(new Set(stringArray(body?.providerIds)));

    if (!briefId || !searchSessionId || providerIds.length === 0) {
      return NextResponse.json(
        { error: "Choose at least one route provider to contact." },
        { status: 400 }
      );
    }

    const procurement = await prisma.works_procurement_requests.findFirst({
      where: {
        brief_id: briefId,
        search_session_id: searchSessionId,
      },
      select: { id: true, name: true, email: true },
    });

    if (!procurement) {
      return NextResponse.json(
        { error: "Add your contact details before WORKS contacts providers on your behalf." },
        { status: 409 }
      );
    }

    const providers = await prisma.works_providers.findMany({
      where: { id: { in: providerIds }, profile_status: { not: "ARCHIVED" } },
      select: { id: true, name: true, email: true },
    });
    const providerById = new Map(providers.map((provider) => [provider.id, provider]));

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.WORKS_OUTREACH_FROM;
    if (!apiKey || !from) {
      return NextResponse.json(
        { error: "WORKS provider email is not configured yet." },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://app.oremea.com").replace(/\/$/, "");
    const results: Array<{ providerId: string; providerName: string; status: string; error?: string }> = [];

    for (const providerId of providerIds) {
      const provider = providerById.get(providerId);
      if (!provider) {
        results.push({ providerId, providerName: "Unknown provider", status: "SKIPPED", error: "Provider not found." });
        continue;
      }
      if (!provider.email) {
        results.push({ providerId, providerName: provider.name, status: "SKIPPED", error: "No provider email is recorded yet." });
        continue;
      }

      try {
        const snapshot = await buildProviderBrief(briefId, providerId);
        const token = randomBytes(32).toString("hex");
        const tokenHash = hashToken(token);
        const responseUrl = `${appUrl}/works/respond/${token}`;
        const relevantSteps = snapshot.relevantSteps;
        const briefSnapshot = JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue;

        const outreach = await prisma.works_provider_outreach.upsert({
          where: {
            procurement_request_id_provider_id: {
              procurement_request_id: procurement.id,
              provider_id: providerId,
            },
          },
          update: {
            route_option_id: snapshot.routeOptionId,
            response_token_hash: tokenHash,
            status: "DRAFT",
            relevant_steps: relevantSteps,
            brief_snapshot: briefSnapshot,
            sent_to_email: provider.email,
            decision: null,
            responded_at: null,
          },
          create: {
            procurement_request_id: procurement.id,
            brief_id: briefId,
            provider_id: providerId,
            route_option_id: snapshot.routeOptionId,
            response_token_hash: tokenHash,
            relevant_steps: relevantSteps,
            brief_snapshot: briefSnapshot,
            sent_to_email: provider.email,
          },
          select: { id: true },
        });

        const stepsHtml = relevantSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
        const requirementsHtml = snapshot.requirements
          .map((requirement) => `<li>${escapeHtml(requirement.displayValue || `${requirement.field}: ${JSON.stringify(requirement.value)}`)}</li>`)
          .join("");

        const { error } = await resend.emails.send({
          from,
          to: provider.email,
          replyTo: procurement.email,
          subject: `WORKS production enquiry: ${snapshot.product}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1c17;max-width:680px;margin:auto">
              <p style="letter-spacing:.18em;font-size:12px">WORKS · by Oremea</p>
              <h1 style="font-size:28px;font-weight:500">Can you help make this?</h1>
              <p><strong>${escapeHtml(snapshot.product)}</strong></p>
              <p>WORKS matched your business to part of a production route for ${escapeHtml(procurement.name)}.</p>
              <p><strong>Your part of the route</strong></p>
              <ul>${stepsHtml}</ul>
              <p><strong>Current production quantity</strong><br>${escapeHtml(quantityText(snapshot))}</p>
              ${requirementsHtml ? `<p><strong>Relevant requirements</strong></p><ul>${requirementsHtml}</ul>` : ""}
              <p style="margin-top:28px"><a href="${responseUrl}" style="display:inline-block;background:#1f1c17;color:white;text-decoration:none;padding:12px 20px;border-radius:999px">Respond to this brief</a></p>
              <p style="font-size:12px;color:#6b665e;margin-top:28px">Your response is attached to this specific WORKS production brief. Broader changes to your WORKS provider profile are handled separately.</p>
            </div>
          `,
        });

        if (error) {
          await prisma.works_provider_outreach.update({ where: { id: outreach.id }, data: { status: "FAILED" } });
          results.push({ providerId, providerName: provider.name, status: "FAILED", error: error.message });
          continue;
        }

        await prisma.works_provider_outreach.update({
          where: { id: outreach.id },
          data: { status: "SENT", sent_at: new Date() },
        });
        results.push({ providerId, providerName: provider.name, status: "SENT" });
      } catch (error) {
        results.push({
          providerId,
          providerName: provider.name,
          status: "FAILED",
          error: error instanceof Error ? error.message : "Provider outreach failed.",
        });
      }
    }

    if (results.some((result) => result.status === "SENT")) {
      await prisma.works_procurement_requests.update({
        where: { id: procurement.id },
        data: { status: "CONTACTED" },
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("WORKS provider outreach failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "WORKS could not contact these providers." },
      { status: 500 }
    );
  }
}
