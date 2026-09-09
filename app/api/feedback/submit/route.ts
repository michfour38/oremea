import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const SUPPORT_EMAIL = "support@oremea.com";
const FEEDBACK_FROM_EMAIL = "Oremea website <website@oremea.com>";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_CATEGORIES = new Set([
  "witness_missed",
  "felt_wrong",
  "unclear",
  "broken",
  "suggestion",
  "other",
  "completion",
]);

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function clarityScore(value: unknown) {
  const score = Number(value);
  return Number.isInteger(score) && score >= 1 && score <= 5 ? score : null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();

    const name = clean(body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const product = clean(body.product, 140) || "Oremea generally";
    const experience = clean(body.experience, 160);
    const category = clean(body.category, 40);
    const message = clean(body.message, 5000);
    const whatChanged = clean(body.whatChanged, 5000);
    const witnessMissed = clean(body.witnessMissed, 5000);
    const source = clean(body.source, 180);
    const website = clean(body.website, 250);
    const replyRequested = body.replyRequested === true;
    const beforeClarity = clarityScore(body.beforeClarity);
    const afterClarity = clarityScore(body.afterClarity);

    // Honeypot: accept bot submissions without sending anything.
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json(
        { success: false, error: "Choose the kind of feedback you are sending." },
        { status: 400 },
      );
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: "Add a valid email address or leave it blank." },
        { status: 400 },
      );
    }

    if (replyRequested && !email) {
      return NextResponse.json(
        { success: false, error: "Add an email address if you would like a reply." },
        { status: 400 },
      );
    }

    if (category === "completion") {
      if (beforeClarity === null || afterClarity === null) {
        return NextResponse.json(
          { success: false, error: "Choose a before and after clarity score." },
          { status: 400 },
        );
      }
    } else if (!message && !witnessMissed) {
      return NextResponse.json(
        { success: false, error: "Tell Oremea what happened before sending." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is missing. Feedback submissions cannot send.");
      return NextResponse.json(
        {
          success: false,
          error: "Feedback is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 },
      );
    }

    const categoryLabel =
      category === "witness_missed"
        ? "The witness missed something"
        : category === "felt_wrong"
          ? "Something felt wrong"
          : category === "unclear"
            ? "Something was unclear"
            : category === "broken"
              ? "Something broke"
              : category === "suggestion"
                ? "Suggestion"
                : category === "completion"
                  ? "Completion survey"
                  : "Other";

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FEEDBACK_FROM_EMAIL,
      to: SUPPORT_EMAIL,
      replyTo: email || undefined,
      subject: `[Oremea private feedback] ${product} · ${categoryLabel}`,
      text: [
        "OREMEA PRIVATE FEEDBACK — NOT FOR PUBLICATION",
        "",
        `Category: ${categoryLabel}`,
        `Product: ${product}`,
        experience ? `Experience: ${experience}` : "",
        source ? `Source: ${source}` : "",
        userId ? `Signed-in user id: ${userId}` : "Signed-in user id: not available",
        name ? `Name supplied: ${name}` : "Name supplied: no",
        email ? `Email supplied: ${email}` : "Email supplied: no",
        `Reply requested: ${replyRequested ? "YES" : "NO"}`,
        "",
        category === "completion" ? "COMPLETION MEASURE" : "",
        beforeClarity !== null ? `Clarity before: ${beforeClarity}/5` : "",
        afterClarity !== null ? `Clarity after: ${afterClarity}/5` : "",
        whatChanged ? `\nWHAT CHANGED\n${whatChanged}` : "",
        witnessMissed ? `\nTHE WITNESS MISSED SOMETHING\n${witnessMissed}` : "",
        message ? `\nFEEDBACK\n${message}` : "",
        "",
        "Privacy boundary:",
        "- This submission is private product feedback.",
        "- Do not publish it on Reviews.",
        "- Do not treat it as publication consent.",
        "- A public reflection requires a separate, explicit Reviews submission.",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (error) {
      console.error("Private feedback email failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Your feedback could not be sent yet. Please try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you. This feedback stays private and has reached Oremea.",
    });
  } catch (error) {
    console.error("Private feedback submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Your feedback could not be sent yet. Please try again.",
      },
      { status: 500 },
    );
  }
}
