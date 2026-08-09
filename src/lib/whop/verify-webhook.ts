import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;
const WEBHOOK_SECRET_PREFIX = "whsec_";

export function verifyWhopWebhook({
  body,
  webhookId,
  webhookTimestamp,
  webhookSignature,
  secret,
  now = new Date(),
}: {
  body: string;
  webhookId: string | null;
  webhookTimestamp: string | null;
  webhookSignature: string | null;
  secret: string;
  now?: Date;
}) {
  if (
    !webhookId ||
    !webhookTimestamp ||
    !webhookSignature ||
    !secret
  ) {
    return false;
  }

  const timestampSeconds = Number(webhookTimestamp);
  const nowSeconds = Math.floor(now.getTime() / 1000);

  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(nowSeconds - timestampSeconds) > MAX_WEBHOOK_AGE_SECONDS
  ) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
  const signingKey = secret.startsWith(WEBHOOK_SECRET_PREFIX)
    ? Buffer.from(secret.slice(WEBHOOK_SECRET_PREFIX.length), "base64")
    : Buffer.from(secret, "utf8");

  if (signingKey.length === 0) {
    return false;
  }

  const expected = createHmac("sha256", signingKey)
    .update(signedContent)
    .digest();
  const signatures = Array.from(
    webhookSignature.matchAll(/v1,([^\s,]+)/g),
    (match) => match[1],
  );

  return signatures.some((signature) => {
    try {
      const received = Buffer.from(signature, "base64");
      return (
        received.length === expected.length &&
        timingSafeEqual(received, expected)
      );
    } catch {
      return false;
    }
  });
}
