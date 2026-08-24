import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown) {
  const cleaned = stringValue(value);
  return cleaned || null;
}

function optionalPositiveNumber(value: unknown) {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function snapshotRecord(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }
  return value as Record<string, unknown>;
}

function snapshotQuestions(snapshot: Record<string, unknown>) {
  return Array.isArray(snapshot.questions)
    ? snapshot.questions.filter(
        (item): item is string => typeof item === "string" && Boolean(item.trim())
      )
    : [];
}

function responseQuestionAnswers(value: unknown, questions: string[]) {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return questions.map((question) => ({
    question,
    answer: stringValue(record[question]).slice(0, 4000),
  }));
}

function decisionLabel(decision: string) {
  switch (decision) {
    case "YES":
      return "Yes — this route is within our capability";
    case "POSSIBLE":
      return "Possibly — more information may be needed";
    case "OUTSIDE_CAPABILITY":
      return "Outside our capability";
    default:
      return decision;
  }
}

const DECISIONS = new Set(["YES", "POSSIBLE", "OUTSIDE_CAPABILITY"]);

export async function POST(req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  try {
    const tokenHash = hashToken(params.token);
    const body = await req.json();
    const decision = stringValue(body?.decision).toUpperCase();

    if (!DECISIONS.has(decision)) {
      return NextResponse.json(
        { error: "Choose how this brief fits your capability." },
        { status: 400 }
      );
    }

    const outreach = await prisma.works_provider_outreach.findUnique({
      where: { response_token_hash: tokenHash },
      select: {
        id: true,
        brief_id: true,
        brief_snapshot: true,
        provider: { select: { name: true, email: true } },
        procurement_request: { select: { name: true, email: true } },
      },
    });

    if (!outreach) {
      return NextResponse.json(
        { error: "This WORKS response link is no longer valid." },
        { status: 404 }
      );
    }

    const snapshot = snapshotRecord(outreach.brief_snapshot);
    const questions = snapshotQuestions(snapshot);
    const questionAnswers = responseQuestionAnswers(body?.questionAnswers, questions);
    const answeredQuestions = questionAnswers.filter((item) => Boolean(item.answer));
    const capacityDateValue = optionalString(body?.capacityDate);
    const capacityDate = capacityDateValue
      ? new Date(`${capacityDateValue}T00:00:00.000Z`)
      : null;
    const moqValue = optionalPositiveNumber(body?.moqValue);
    const moqUnit = optionalString(body?.moqUnit);
    const leadTime = optionalString(body?.leadTime);
    const pricingNotes = optionalString(body?.pricingNotes);
    const certificationNotes = optionalString(body?.certificationNotes);
    const providerNotes = optionalString(body?.providerNotes);
    const product =
      typeof snapshot.product === "string" && snapshot.product.trim()
        ? snapshot.product.trim()
        : "your production brief";
    const updatedSnapshot = JSON.parse(
      JSON.stringify({
        ...snapshot,
        responseQuestionAnswers: questionAnswers,
      })
    ) as Prisma.InputJsonValue;

    await prisma.works_provider_outreach.update({
      where: { id: outreach.id },
      data: {
        decision: decision as never,
        status: decision === "OUTSIDE_CAPABILITY" ? "DECLINED" : "RESPONDED",
        responded_at: new Date(),
        moq_value: moqValue,
        moq_unit: moqUnit,
        lead_time_text: leadTime,
        capacity_date: capacityDate,
        pricing_notes: pricingNotes,
        certification_notes: certificationNotes,
        provider_notes: providerNotes,
        brief_snapshot: updatedSnapshot,
      },
    });

    let notificationSent = false;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.WORKS_OUTREACH_FROM || process.env.RESEND_FROM_EMAIL;

    if (apiKey && from && outreach.procurement_request.email) {
      try {
        const resend = new Resend(apiKey);
        const detailRows = [
          moqValue != null
            ? `<p><strong>Minimum order quantity:</strong> ${escapeHtml(moqValue)} ${escapeHtml(moqUnit ?? "")}</p>`
            : "",
          leadTime
            ? `<p><strong>Estimated lead time:</strong> ${escapeHtml(leadTime)}</p>`
            : "",
          capacityDateValue
            ? `<p><strong>Capacity available from:</strong> ${escapeHtml(capacityDateValue)}</p>`
            : "",
          pricingNotes
            ? `<p><strong>Pricing / quote notes:</strong> ${escapeHtml(pricingNotes)}</p>`
            : "",
          certificationNotes
            ? `<p><strong>Certification / compliance:</strong> ${escapeHtml(certificationNotes)}</p>`
            : "",
          providerNotes
            ? `<p><strong>Additional note:</strong> ${escapeHtml(providerNotes)}</p>`
            : "",
        ].filter(Boolean);

        const questionsHtml = questions.length
          ? `<div style="margin-top:24px"><p style="font-weight:700">Questions from your brief</p>${questionAnswers
              .map(
                ({ question, answer }) =>
                  `<div style="margin-top:16px"><p style="margin:0;font-weight:600">${escapeHtml(question)}</p><p style="margin:6px 0 0;color:#4f4a42">${answer ? escapeHtml(answer) : "Not answered yet"}</p></div>`
              )
              .join("")}</div>`
          : "";

        const { error } = await resend.emails.send({
          from,
          to: outreach.procurement_request.email,
          ...(outreach.provider.email ? { replyTo: outreach.provider.email } : {}),
          subject: `${outreach.provider.name} responded to your WORKS brief`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.65;color:#1f1c17;max-width:680px;margin:auto">
              <p style="letter-spacing:.18em;font-size:12px">WORKS · by Oremea</p>
              <p>Hello ${escapeHtml(outreach.procurement_request.name)},</p>
              <p><strong>${escapeHtml(outreach.provider.name)}</strong> responded to your production enquiry for:</p>
              <p style="font-size:20px;font-weight:700">${escapeHtml(product)}</p>
              <p><strong>Response:</strong> ${escapeHtml(decisionLabel(decision))}</p>
              ${questionsHtml}
              ${detailRows.length ? `<div style="margin-top:24px">${detailRows.join("")}</div>` : ""}
              ${answeredQuestions.length < questions.length ? `<p style="margin-top:24px;color:#6b665e">Any unanswered questions remain open for confirmation.</p>` : ""}
              ${outreach.provider.email ? `<p style="margin-top:28px">Reply to this email to continue directly with ${escapeHtml(outreach.provider.name)}.</p>` : ""}
              <p style="margin-top:28px">Kind regards,<br>WORKS by Oremea</p>
            </div>
          `,
        });

        if (error) {
          console.error("WORKS customer response notification failed:", error);
        } else {
          notificationSent = true;
        }
      } catch (notificationError) {
        console.error("WORKS customer response notification failed:", notificationError);
      }
    }

    return NextResponse.json({
      ok: true,
      notificationSent,
      message: notificationSent
        ? "Thank you. Your response has been recorded and the WORKS customer has been emailed."
        : "Thank you. Your response has been recorded for the WORKS customer.",
    });
  } catch (error) {
    console.error("WORKS provider response failed:", error);
    return NextResponse.json(
      { error: "WORKS could not save this response yet." },
      { status: 500 }
    );
  }
}
