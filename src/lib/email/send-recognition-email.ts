import { Resend } from "resend";

type SendRecognitionEmailArgs = {
  to: string;
  firstName?: string;
  mirrorOutput: string;
  sessionId: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendRecognitionEmail({
  to,
  firstName,
  mirrorOutput,
  sessionId,
}: SendRecognitionEmailArgs) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn("RESEND_API_KEY is missing. Recognition email skipped.");
      return;
    }

    const resend = new Resend(apiKey);

    const safeMirrorOutput = escapeHtml(mirrorOutput);
    const greeting = firstName?.trim()
      ? `Hi ${escapeHtml(firstName.trim())},`
      : "Hi,";

    const archiveLink = `https://recognition.oremea.com/archive?session=${encodeURIComponent(sessionId)}`;

    await resend.emails.send({
      from: "Oremea <support@oremea.com>",
      to,
      subject: "Your Recognition reflection",
      html: `
        <div style="background:#0A0A0A;padding:40px 20px;font-family:Georgia,serif;color:#EAEAEA;">
          <div style="max-width:720px;margin:0 auto;">
            <p style="letter-spacing:0.35em;font-size:12px;color:#BFBFBF;">OREMEA</p>

            <h1 style="font-size:42px;font-weight:400;margin-top:24px;color:#EAEAEA;">
              Your Recognition reflection
            </h1>

            <p style="margin-top:28px;font-size:18px;line-height:1.8;color:#BFBFBF;">
              ${greeting}
            </p>

            <p style="margin-top:20px;font-size:20px;line-height:1.9;color:#D8D0C0;white-space:pre-wrap;">
              ${safeMirrorOutput}
            </p>

            <div style="margin-top:48px;padding:32px;border:1px solid #3A2F1C;background:#14110B;border-radius:24px;">
              <p style="font-size:30px;color:#EAEAEA;margin:0;">
                You already recognise the pattern.
              </p>

              <p style="margin-top:20px;font-size:22px;line-height:1.8;color:#BFBFBF;">
                What you haven’t done yet… is stay with it long enough to change it.
              </p>

              <p style="margin-top:24px;font-size:18px;line-height:1.8;color:#BFBFBF;">
                Your Recognition remains available in your archive whenever you want to revisit it.
              </p>

              <a href="${archiveLink}" style="display:inline-block;margin-top:18px;padding:12px 22px;border:1px solid #3A2F1C;border-radius:999px;color:#BFBFBF;text-decoration:none;font-size:16px;">
                Open your Recognition Archive
              </a>

              <br />

              <a href="https://resonance.oremea.com" style="display:inline-block;margin-top:28px;padding:14px 26px;border:1px solid #C6A96B;border-radius:999px;color:#C6A96B;text-decoration:none;font-size:18px;">
                Continue to Resonance
              </a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Recognition email failed:", error);
  }
}
