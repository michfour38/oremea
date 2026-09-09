import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const SUPPORT_EMAIL = "support@oremea.com";
const FEEDBACK_FROM_EMAIL = "Oremea website <website@oremea.com>";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_CATEGORIES = new Set([
  "contact",
  "completion",
  // Kept temporarily for compatibility with any older deployed feedback form.
  "witness_missed",
  "felt_wrong",
  "unclear",
  "broken",
  "suggestion",
  "other",
]);

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function score1to5(value: unknown) {
  const score = Number(value);
  return Number.isInteger(score) && score >= 1 && score <= 5 ? score : null;
}

function score0to10(value: unknown) {
  const score = Number(value);
  return Number.isInteger(score) && score >= 0 && score <= 10 ? score : null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();

    const name = clean(body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const product = clean(body.product, 140) || "Oremea generally";
    const category = clean(body.category, 40);
    const message = clean(body.message, 5000);
    const whatChanged = clean(body.whatChanged, 5000);
    const mostUseful = clean(body.mostUseful, 5000);
    const improvement = clean(body.improvement, 5000);
    const anythingElse = clean(body.anythingElse, 5000);
    const source = clean(body.source, 500);
    const website = clean(body.website, 250);
    const replyRequested = body.replyRequested === true;
    const beforeClarity = score1to5(body.beforeClarity);
    const afterClarity = score1to5(body.afterClarity);
    const fitScore = score1to5(body.fitScore);
    const recommendScore = score0to10(body.recommendScore);

    // Honeypot: accept bot submissions without sending anything.
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json(
        { success: false, error: "This message could not be sent." },
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
      if (
        beforeClarity === null ||
        afterClarity === null ||
        fitScore === null ||
        recommendScore === null
      ) {
        return NextResponse.json(
          { success: false, error: "Complete the survey scores before sending." },
          { status: 400 },
        );
      }
    } else if (!message) {
      return NextResponse.json(
        { success: false, error: "Write a message before sending." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is missing. Feedback submissions cannot send.");
      return NextResponse.json(
        {
          success: false,
          error: "This form is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 },
      );
    }

    const categoryLabel =
      category === "completion" ? "Completion survey" : "Quick contact";

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FEEDBACK_FROM_EMAIL,
      to: SUPPORT_EMAIL,
      replyTo: email || undefined,
      subject:
        category === "completion"
          ? `[Oremea survey] ${product}`
          : "[Oremea feedback] Quick contact",
      text: [
        category === "completion"
          ? "OREMEA COMPLETION SURVEY — PRIVATE"
          : "OREMEA QUICK CONTACT — PRIVATE",
        "",
        `Type: ${categoryLabel}`,
        category === "completion" ? `Product: ${product}` : "",
        source ? `Source: ${source}` : "",
        userId ? `Signed-in user id: ${userId}` : "Signed-in user id: not available",
        name ? `Name supplied: ${name}` : "Name supplied: no",
        email ? `Email supplied: ${email}` : "Email supplied: no",
        `Reply requested: ${replyRequested ? "YES" : "NO"}`,
        "",
        category === "completion" ? "SURVEY SCORES" : "",
        beforeClarity !== null ? `Clarity before: ${beforeClarity}/5` : "",
        afterClarity !== null ? `Clarity after: ${afterClarity}/5` : "",
        fitScore !== null ? `Did what they came for: ${fitScore}/5` : "",
        recommendScore !== null ? `Recommend: ${recommendScore}/10` : "",
        whatChanged ? `\nWHAT CHANGED\n${whatChanged}` : "",
        mostUseful ? `\nMOST USEFUL\n${mostUseful}` : "",
        improvement ? `\nWHAT COULD WORK BETTER\n${improvement}` : "",
        anythingElse ? `\nANYTHING ELSE\n${anythingElse}` : "",
        message ? `\nMESSAGE\n${message}` : "",
        "",
        "Privacy boundary:",
        "- This submission is private.",
        "- Do not publish it on Reviews.",
        "- Do not treat it as publication consent.",
        "- A public reflection requires a separate, explicit Reviews submission.",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (error) {
      console.error("Feedback email failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Your message could not be sent yet. Please try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        category === "completion"
          ? "Thank you. Your survey has reached Oremea privately."
          : "Message sent to Oremea.",
    });
  } catch (error) {
    console.error("Feedback submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Your message could not be sent yet. Please try again.",
      },
      { status: 500 },
    );
  }
}
