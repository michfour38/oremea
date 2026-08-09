import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const SUPPORT_EMAIL = "support@oremea.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = clean(body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const subject = clean(body.subject, 160);
    const message = clean(body.message, 5000);
    const website = clean(body.website, 250);

    if (website) {
      return NextResponse.json({ success: true });
    }

    if (
      !name ||
      !EMAIL_PATTERN.test(email) ||
      !subject ||
      message.length < 10
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Add your name, a valid email, a subject and a short message.",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY is missing. Contact form cannot send.");
      return NextResponse.json(
        {
          success: false,
          error:
            "Support is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 },
      );
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Oremea website <support@oremea.com>",
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: "[Oremea contact] " + subject,
      text: [
        "Name: " + name,
        "Email: " + email,
        "Subject: " + subject,
        "",
        message,
      ].join("\n"),
    });

    if (error) {
      console.error("Contact email failed:", error);
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
      message: "Your message has been sent to Oremea.",
    });
  } catch (error) {
    console.error("Contact request failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Your message could not be sent yet. Please try again.",
      },
      { status: 500 },
    );
  }
}
