import { Resend } from "resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendPartyWelcomeEmail({
  to,
  firstName,
  questionsToken,
  guestPassTokens,
}: {
  to: string;
  firstName?: string | null;
  questionsToken: string;
  guestPassTokens: string[];
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("RESEND_API_KEY is missing. Party welcome email skipped.");
    return false;
  }

  const origin =
    process.env.NEXT_PUBLIC_OREMEA_PARTY_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://www.oremea.com";
  const startLabel = process.env.OREMEA_PARTY_START_LABEL?.trim();
  const questionsUrl =
    `${origin.replace(/\/$/, "")}/party/questions?token=${encodeURIComponent(questionsToken)}`;
  const greeting = firstName?.trim()
    ? `Hi ${escapeHtml(firstName.trim())},`
    : "Hi,";

  const guestPassesHtml = guestPassTokens.slice(0, 2).map((token, index) => {
    const passUrl =
      `${origin.replace(/\/$/, "")}/party?pass=${encodeURIComponent(token)}`;
    const subject = "A guest pass for What Keeps Repeating in Connection?";
    const body = [
      "I’m joining a free live Oremea session called “What Keeps Repeating in Connection?”",
      "",
      "I have a guest pass for you. If the conversation feels useful, claim your place here:",
      passUrl,
    ].join("\n");
    const mailto =
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return `
      <div style="margin-top:16px;padding:20px;border:1px solid #3A2F1C;border-radius:18px;">
        <p style="margin:0;font-size:18px;color:#F1DFB4;">Guest Pass ${index + 1}</p>
        <p style="margin-top:10px;font-size:14px;line-height:1.7;color:#BFBFBF;">
          One person can claim this pass. Oremea does not need their email address until they choose to register.
        </p>
        <a href="${mailto}" style="display:inline-block;margin-top:12px;padding:10px 18px;border:1px solid #C8A96A;border-radius:999px;color:#F1DFB4;text-decoration:none;font-size:14px;">
          Send Guest Pass ${index + 1} by email
        </a>
        <p style="margin-top:12px;font-size:12px;line-height:1.6;color:#777;word-break:break-all;">
          Or copy this pass link: ${escapeHtml(passUrl)}
        </p>
      </div>
    `;
  }).join("");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Oremea <support@oremea.com>",
    to,
    subject: "Welcome + your private Questions Box — Oremea",
    html: `
      <div style="background:#080704;padding:40px 20px;font-family:Georgia,serif;color:#EAEAEA;">
        <div style="max-width:680px;margin:0 auto;">
          <p style="letter-spacing:0.3em;font-size:12px;color:#C8A96A;">OREMEA</p>
          <h1 style="font-size:36px;font-weight:400;line-height:1.2;margin:24px 0 0;">
            What Keeps Repeating in Connection?
          </h1>
          <p style="margin-top:28px;font-size:17px;line-height:1.8;color:#D0D0D0;">${greeting}</p>
          <p style="font-size:17px;line-height:1.8;color:#BFBFBF;">
            Your place in the free live Oremea session is reserved.
          </p>
          ${startLabel ? `<p style="margin-top:20px;font-size:14px;letter-spacing:0.12em;color:#F1DFB4;">${escapeHtml(startLabel)}</p>` : ""}
          <div style="margin-top:34px;padding:28px;border:1px solid #4A3A20;background:#15120C;border-radius:22px;">
            <p style="margin:0;font-size:25px;color:#F1DFB4;">Questions Box</p>
            <p style="margin-top:16px;font-size:16px;line-height:1.8;color:#CFCFCF;">
              This box stays open before the live session. If another question, pattern, example,
              contradiction, or thought comes up, add it here. You can use the box more than once,
              and what is submitted helps shape the live conversation.
            </p>
            <a href="${questionsUrl}" style="display:inline-block;margin-top:18px;padding:12px 22px;border:1px solid #C8A96A;border-radius:999px;color:#F1DFB4;text-decoration:none;font-size:15px;">
              Open the Questions Box
            </a>
          </div>
          <div style="margin-top:34px;padding:28px;border:1px solid #4A3A20;background:#10100D;border-radius:22px;">
            <p style="margin:0;font-size:25px;color:#F1DFB4;">Two guest passes</p>
            <p style="margin-top:16px;font-size:16px;line-height:1.8;color:#CFCFCF;">
              These are yours to send. Each pass is unique and can be claimed once.
              Use the buttons below to open a ready-written email from your own mailbox.
            </p>
            ${guestPassesHtml}
          </div>
          <p style="margin-top:30px;font-size:14px;line-height:1.8;color:#777;">
            Please keep this welcome email private: it contains your personal Questions Box link.
            Send the guest passes using the buttons above rather than forwarding this whole email.
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Party welcome email failed:", error);
    return false;
  }

  return true;
}
