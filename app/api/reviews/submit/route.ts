import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const SUPPORT_EMAIL = "support@oremea.com";
const REVIEWS_FROM_EMAIL = "Oremea website <website@oremea.com>";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_PRODUCTS = new Set([
  "Recognition",
  "Compass",
  "Resonance · The Hearth",
  "Resonance · Mirror",
  "Resonance · Garden",
  "Resonance · Bearing",
  "Resonance · Pulse",
  "Resonance · Shadow",
  "Resonance · Forge",
  "Resonance · Vision",
  "Resonance · Gathering",
  "Resonance · Becoming",
  "Harmonize",
  "The Current",
  "Oremea generally",
]);

const ALLOWED_DISPLAY = new Set(["first_name", "initial", "anonymous"]);

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = clean(body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const product = clean(body.product, 120);
    const reflection = clean(body.reflection, 3000);
    const displayPreference = clean(body.displayPreference, 40);
    const website = clean(body.website, 250);
    const publicationConsent = body.publicationConsent === true;

    // Honeypot: accept bot submissions without sending anything.
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (
      !name ||
      !EMAIL_PATTERN.test(email) ||
      !ALLOWED_PRODUCTS.has(product) ||
      reflection.length < 20 ||
      !ALLOWED_DISPLAY.has(displayPreference) ||
      !publicationConsent
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Add your name, a valid email, the Oremea experience, your reflection, a display preference and publication permission.",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY is missing. Review submissions cannot send.");
      return NextResponse.json(
        {
          success: false,
          error: "Review submission is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 },
      );
    }

    const displayLabel =
      displayPreference === "first_name"
        ? "First name"
        : displayPreference === "initial"
          ? "Initial"
          : "Anonymous";

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: REVIEWS_FROM_EMAIL,
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Oremea review submission] ${product} · ${name}`,
      text: [
        "OREMEA REVIEW SUBMISSION — PENDING HUMAN REVIEW",
        "",
        `Private name: ${name}`,
        `Private email: ${email}`,
        `Experience: ${product}`,
        `Requested public attribution: ${displayLabel}`,
        "Publication permission: YES",
        "",
        "SUBMITTED REFLECTION",
        reflection,
        "",
        "Moderation boundary:",
        "- Do not publish automatically.",
        "- Do not rewrite the participant's meaning.",
        "- Obscure profanity or identifying details only where needed for the public page.",
        "- Email and private name are not public unless the participant explicitly selected a compatible attribution.",
      ].join("\n"),
    });

    if (error) {
      console.error("Review submission email failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Your reflection could not be sent yet. Please try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Thank you. Your reflection has reached Oremea for human review. Nothing is published automatically.",
    });
  } catch (error) {
    console.error("Review submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Your reflection could not be sent yet. Please try again.",
      },
      { status: 500 },
    );
  }
}
