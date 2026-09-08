import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const SIGNUP_EMAIL = "support@oremea.com";
const FROM_EMAIL = "Oremea website <website@oremea.com>";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = clean(body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const whatsapp = clean(body.whatsapp, 80);
    const invitedBy = clean(body.invitedBy, 120);
    const whyNow = clean(body.whyNow, 1200);
    const commitmentAccepted = body.commitmentAccepted === true;
    const riskAccepted = body.riskAccepted === true;
    const website = clean(body.website, 250);

    if (website) {
      return NextResponse.json({ success: true });
    }

    if (
      !name ||
      !EMAIL_PATTERN.test(email) ||
      !whatsapp ||
      !commitmentAccepted ||
      !riskAccepted
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Add your name, valid email and WhatsApp number, then confirm both commitments.",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY is missing. Stokvel signup cannot send.");
      return NextResponse.json(
        {
          success: false,
          error: "Signup is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 },
      );
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: SIGNUP_EMAIL,
      replyTo: email,
      subject: `[Monetise stokvel] ${name} wants into the Founding 17`,
      text: [
        "Monetise Stokvel — Founding 17 signup",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `WhatsApp: ${whatsapp}`,
        `Invited by: ${invitedBy || "Not supplied"}`,
        `R2,000/month commitment accepted: ${commitmentAccepted ? "Yes" : "No"}`,
        `No-income-guarantee / rules acknowledgement accepted: ${riskAccepted ? "Yes" : "No"}`,
        "",
        "Why now:",
        whyNow || "Not supplied",
      ].join("\n"),
    });

    if (error) {
      console.error("Stokvel signup email failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Your signup could not be sent yet. Please try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Your request is in. Join the WhatsApp group to help form the Founding 17.",
    });
  } catch (error) {
    console.error("Stokvel signup request failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Your signup could not be sent yet. Please try again.",
      },
      { status: 500 },
    );
  }
}
