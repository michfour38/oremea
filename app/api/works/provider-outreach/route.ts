import { createHash, randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { buildProviderBrief } from "@/lib/works/outreach/build-provider-brief";
import { getRouteSummary } from "@/lib/works/routes/get-route-summary";
import { ownsWorksAnonymousSearch } from "@/lib/works/searches/anonymous-search-ownership";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
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

function unitLabel(snapshot: Awaited<ReturnType<typeof buildProviderBrief>>) {
  const unit = snapshot.quantity.unit;
  if (unit !== "UNITS") {
    return unit?.toLowerCase().replaceAll("_", " ") ?? "units";
  }

  switch (snapshot.packagingFormat) {
    case "BOTTLE":
      return "bottles";
    case "JAR":
      return "jars";
    case "SACHET":
      return "sachets";
    case "POUCH":
      return "pouches";
    case "CAN":
      return "cans";
    case "TIN":
      return "tins";
    case "BOX":
      return "boxes";
    case "TUB":
      return "tubs";
    default:
      return "units";
  }
}

function fillSizeText(snapshot: Awaited<ReturnType<typeof buildProviderBrief>>) {
  if (snapshot.quantity.fillVolumeMl != null) {
    return `${snapshot.quantity.fillVolumeMl} ml each`;
  }
  if (snapshot.quantity.fillWeightG != null) {
    return `${snapshot.quantity.fillWeightG} g each`;
  }
  return "";
}

function quantityText(snapshot: Awaited<ReturnType<typeof buildProviderBrief>>) {
  const quantity = snapshot.quantity;
  const unit = unitLabel(snapshot);
  const preferred = quantity.preferred ?? quantity.target;
  const fillSize = fillSizeText(snapshot);
  const lines: string[] = [];

  if (preferred != null) {
    lines.push(
      `Preferred first run: ${preferred} ${unit}${fillSize ? `, ${fillSize}` : ""}.`
    );
  }

  if (quantity.minimum != null && quantity.maximum != null) {
    lines.push(`Workable range: ${quantity.minimum}-${quantity.maximum} ${unit}.`);
  }

  if (lines.length === 0 && quantity.target != null) {
    lines.push(`${quantity.target} ${unit}${fillSize ? `, ${fillSize}` : ""}.`);
  }

  return lines.length > 0
    ? lines.join("\n")
    : "Quantity details are included in the full brief.";
}

function enumLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function requirementValueText(value: unknown) {
  if (typeof value === "string") return enumLabel(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function requirementText(snapshot: Awaited<ReturnType<typeof buildProviderBrief>>) {
  return snapshot.requirements
    .map((requirement) => {
      if (requirement.displayValue?.trim()) return requirement.displayValue.trim();

      if (requirement.field === "credential.HALAAL.authority_requirement") {
        switch (requirement.value) {
          case "ANY_RECOGNISED_CURRENT_CERTIFICATION":
            return "Any recognised current Halaal certification is acceptable.";
          case "SPECIFIC_AUTHORITY_REQUIRED":
            return "A specific Halaal certifying authority is required.";
          case "UNSURE":
            return "The required Halaal certifying authority is still to be confirmed.";
        }
      }

      if (requirement.field === "credential.HALAAL.specific_authority") {
        const authority = stringValue(requirement.value);
        return authority ? `Required Halaal certifying authority: ${authority}.` : "";
      }

      const value = requirementValueText(requirement.value);
      if (!value) return "";
      const label = requirement.field
        .split(".")
        .at(-1)
        ?.replaceAll("_", " ")
        .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
      return label ? `${label}: ${value}.` : value;
    })
    .filter((value): value is string => Boolean(value?.trim()));
}

type RouteQuestion = {
  audience: string;
  prompt: string;
};

function uniquePrompts(questions: RouteQuestion[]) {
  return Array.from(
    new Set(
      questions
        .map((question) => question.prompt.trim())
        .filter((prompt) => prompt.length > 0)
    )
  );
}

function providerQuestionsFor(
  providerName: string,
  snapshot: Awaited<ReturnType<typeof buildProviderBrief>>,
  questions: RouteQuestion[]
) {
  const providerQuestions = questions.filter(
    (question) => question.audience === "PROVIDER"
  );
  if (providerQuestions.length === 0) return [];

  const named = providerQuestions.filter((question) =>
    question.prompt.toLowerCase().includes(providerName.toLowerCase())
  );
  const handlesManufacturing = snapshot.relevantSteps.some((step) =>
    step.toLowerCase().includes("manufactur")
  );

  if (handlesManufacturing) return uniquePrompts(providerQuestions);
  return uniquePrompts(named);
}

function buildEditableBody({
  snapshot,
  providerName,
  requesterName,
  requesterEmail,
  requesterPhone,
  questions,
}: {
  snapshot: Awaited<ReturnType<typeof buildProviderBrief>>;
  providerName: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  questions: string[];
}) {
  const lines = [
    `Hello ${providerName} team,`,
    "",
    "Can you help make this?",
    "",
    snapshot.product,
    "",
    `WORKS matched your business to part of a production route for ${requesterName}.`,
    "",
    "Your part of the route",
    ...snapshot.relevantSteps.map((step) => `- ${step}`),
    "",
    "Production quantity",
    quantityText(snapshot),
  ];

  const requirements = requirementText(snapshot);
  if (requirements.length > 0) {
    lines.push(
      "",
      "Relevant requirements",
      ...requirements.map((requirement) => `- ${requirement}`)
    );
  }

  if (questions.length > 0) {
    lines.push(
      "",
      "Questions to confirm",
      ...questions.map((question) => `- ${question}`)
    );
  }

  lines.push(
    "",
    "Please use the secure response button below to confirm what is possible and add any useful notes.",
    "",
    "Kind regards,",
    requesterName,
    requesterEmail
  );

  if (requesterPhone) lines.push(requesterPhone);
  return lines.join("\n");
}

function bodyTextToHtml(bodyText: string) {
  return escapeHtml(bodyText).replaceAll("\n", "<br>");
}

function questionsFromDraft(bodyText: string) {
  const lines = bodyText.replaceAll("\r\n", "\n").split("\n");
  const headingIndex = lines.findIndex(
    (line) => line.trim().toLowerCase() === "questions to confirm"
  );
  if (headingIndex < 0) return [];

  const questions: string[] = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      if (questions.length) break;
      continue;
    }
    if (!line.startsWith("-")) break;
    const question = line.replace(/^-\s*/, "").trim();
    if (question && !questions.includes(question)) questions.push(question);
  }
  return questions;
}

function providerResponseUrl(token: string) {
  const dedicatedUrl = process.env.WORKS_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (dedicatedUrl) return `${dedicatedUrl}/respond/${token}`;

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://app.oremea.com"
  ).replace(/\/$/, "");
  return `${appUrl}/works/respond/${token}`;
}

type DraftValue = {
  subject: string;
  bodyText: string;
};

function draftMap(value: unknown) {
  const result = new Map<string, DraftValue>();
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;

  for (const [providerId, draft] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) continue;
    const record = draft as Record<string, unknown>;
    const subject = stringValue(record.subject).slice(0, 240);
    const bodyText = stringValue(record.bodyText).slice(0, 12000);
    if (subject && bodyText) result.set(providerId, { subject, bodyText });
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const briefId = stringValue(body?.briefId);
    const searchSessionId = stringValue(body?.searchSessionId);
    const providerIds = Array.from(new Set(stringArray(body?.providerIds)));
    const previewOnly = body?.preview === true;
    const drafts = draftMap(body?.drafts);

    if (!briefId || !searchSessionId || providerIds.length === 0) {
      return NextResponse.json(
        { error: "Choose at least one route provider to contact" },
        { status: 400 }
      );
    }

    const searchSession = await prisma.works_search_sessions.findUnique({
      where: { id: searchSessionId },
      select: {
        brief_id: true,
        browser_session_id: true,
        market: { select: { slug: true } },
      },
    });

    if (
      !searchSession ||
      searchSession.brief_id !== briefId ||
      !ownsWorksAnonymousSearch({
        request: req,
        marketSlug: searchSession.market.slug,
        expectedBrowserSessionId: searchSession.browser_session_id,
      })
    ) {
      return NextResponse.json(
        { error: "This WORKS search is not available to this browser." },
        { status: 403 }
      );
    }

    const procurement = await prisma.works_procurement_requests.findFirst({
      where: {
        brief_id: briefId,
        search_session_id: searchSessionId,
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    if (!procurement) {
      return NextResponse.json(
        { error: "Add your contact details before WORKS prepares provider emails" },
        { status: 409 }
      );
    }

    const providers = await prisma.works_providers.findMany({
      where: {
        id: { in: providerIds },
        profile_status: { not: "ARCHIVED" },
      },
      select: { id: true, name: true, email: true },
    });
    const providerById = new Map(
      providers.map((provider) => [provider.id, provider])
    );
    const routeSummary = await getRouteSummary(briefId);
    const routeQuestions = routeSummary?.nextQuestions ?? [];

    if (previewOnly) {
      const previews = [];

      for (const providerId of providerIds) {
        const provider = providerById.get(providerId);
        if (!provider?.email) continue;

        const snapshot = await buildProviderBrief(briefId, providerId);
        const questions = providerQuestionsFor(
          provider.name,
          snapshot,
          routeQuestions
        );
        previews.push({
          providerId,
          providerName: provider.name,
          recipient: provider.email,
          replyTo: procurement.email,
          requesterName: procurement.name,
          subject: `WORKS production enquiry: ${snapshot.product}`,
          bodyText: buildEditableBody({
            snapshot,
            providerName: provider.name,
            requesterName: procurement.name,
            requesterEmail: procurement.email,
            requesterPhone: procurement.phone,
            questions,
          }),
          questionCount: questions.length,
        });
      }

      return NextResponse.json({ previews });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.WORKS_OUTREACH_FROM;
    if (!apiKey || !from) {
      return NextResponse.json(
        { error: "WORKS provider email is not configured yet" },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);
    const results: Array<{
      providerId: string;
      providerName: string;
      status: string;
      error?: string;
    }> = [];

    for (const providerId of providerIds) {
      const provider = providerById.get(providerId);
      if (!provider) {
        results.push({
          providerId,
          providerName: "Unknown provider",
          status: "SKIPPED",
          error: "Provider not found",
        });
        continue;
      }
      if (!provider.email) {
        results.push({
          providerId,
          providerName: provider.name,
          status: "SKIPPED",
          error: "No provider email is recorded yet",
        });
        continue;
      }

      try {
        const existingOutreach = await prisma.works_provider_outreach.findUnique({
          where: {
            procurement_request_id_provider_id: {
              procurement_request_id: procurement.id,
              provider_id: providerId,
            },
          },
          select: { status: true },
        });

        if (
          existingOutreach &&
          ["SENT", "RESPONDED", "DECLINED"].includes(existingOutreach.status)
        ) {
          results.push({
            providerId,
            providerName: provider.name,
            status: "SKIPPED",
            error: "This provider has already been contacted for this brief.",
          });
          continue;
        }

        const snapshot = await buildProviderBrief(briefId, providerId);
        const questions = providerQuestionsFor(
          provider.name,
          snapshot,
          routeQuestions
        );
        const fallbackDraft = {
          subject: `WORKS production enquiry: ${snapshot.product}`,
          bodyText: buildEditableBody({
            snapshot,
            providerName: provider.name,
            requesterName: procurement.name,
            requesterEmail: procurement.email,
            requesterPhone: procurement.phone,
            questions,
          }),
        };
        const draft = drafts.get(providerId) ?? fallbackDraft;
        const sentQuestions = questionsFromDraft(draft.bodyText);
        const token = randomBytes(32).toString("hex");
        const tokenHash = hashToken(token);
        const responseUrl = providerResponseUrl(token);
        const relevantSteps = snapshot.relevantSteps;
        const briefSnapshot = JSON.parse(
          JSON.stringify({
            ...snapshot,
            emailDraft: draft,
            questions: sentQuestions,
          })
        ) as Prisma.InputJsonValue;

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

        const { error } = await resend.emails.send({
          from,
          to: provider.email,
          replyTo: procurement.email,
          subject: draft.subject,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.65;color:#1f1c17;max-width:680px;margin:auto">
              <p style="letter-spacing:.18em;font-size:12px">WORKS · by Oremea</p>
              <div>${bodyTextToHtml(draft.bodyText)}</div>
              <p style="margin-top:28px"><a href="${responseUrl}" style="display:inline-block;background:#1f1c17;color:white;text-decoration:none;padding:12px 20px;border-radius:999px">Respond to this brief</a></p>
              <p style="font-size:12px;color:#6b665e;margin-top:28px">Your response is attached to this specific WORKS production brief. Broader changes to your WORKS provider profile are handled separately.</p>
            </div>
          `,
        });

        if (error) {
          await prisma.works_provider_outreach.update({
            where: { id: outreach.id },
            data: { status: "FAILED" },
          });
          results.push({
            providerId,
            providerName: provider.name,
            status: "FAILED",
            error: error.message,
          });
          continue;
        }

        await prisma.works_provider_outreach.update({
          where: { id: outreach.id },
          data: { status: "SENT", sent_at: new Date() },
        });
        results.push({
          providerId,
          providerName: provider.name,
          status: "SENT",
        });
      } catch (error) {
        results.push({
          providerId,
          providerName: provider.name,
          status: "FAILED",
          error:
            error instanceof Error ? error.message : "Provider outreach failed",
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
      {
        error:
          error instanceof Error
            ? error.message
            : "WORKS could not contact these providers",
      },
      { status: 500 }
    );
  }
}
