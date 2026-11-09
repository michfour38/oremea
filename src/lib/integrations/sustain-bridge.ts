import { getCompassAccessState } from "@/src/lib/compass/compass-access";
import { getRecognitionConversationAccess } from "@/src/lib/recognition/recognition-conversation-access";
import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-runs";

export type SustainProduct = "recognition" | "compass" | "resonance";
export type SharedSustainReference = { title: string; content: string };
const products: SustainProduct[] = ["recognition", "compass", "resonance"];

export function isSustainProduct(value: unknown): value is SustainProduct {
  return typeof value === "string" && products.includes(value as SustainProduct);
}

function bridgeConfig() {
  const url = process.env.SUSTAIN_BRIDGE_URL?.trim() ?? "";
  const secret = process.env.SUSTAIN_OREMEA_BRIDGE_SECRET?.trim() ?? "";
  if (!url || secret.length < 32) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    return { origin: parsed.origin, secret };
  } catch {
    return null;
  }
}

export async function hasSustainProductAccess(
  userId: string,
  product: SustainProduct,
  emails: string[],
): Promise<boolean> {
  if (product === "recognition") {
    // Checking for a link MUST NOT activate a time-limited creator key
    const access = await getRecognitionConversationAccess({ userId, emails });
    return access.active;
  }
  if (product === "compass") {
    // Reuse existing Whop/purchase/pass policy — do not mint an entitlement
    const access = await getCompassAccessState(userId);
    return access.active;
  }
  // Only an existing active purchased/approved journey is a valid link
  return Boolean(await getActiveResonanceRun(userId));
}

async function callSustain(path: string, input: Record<string, unknown>) {
  const config = bridgeConfig();
  if (!config) return null;
  try {
    const response = await fetch(new URL(path, config.origin), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sustain-oremea-secret": config.secret,
      },
      body: JSON.stringify(input),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return await response.json() as unknown;
  } catch {
    // Do not log reference content or codes — an unavailable bridge never
    // interrupts Recognition, Compass or a Resonance journey
    return null;
  }
}

/** Link after a SUSTAIN opt-in and separate authenticated Oremea confirmation */
export async function redeemSustainPairing(userId: string, product: SustainProduct, code: string) {
  const result = await callSustain("/integrations/oremea/redeem", {
    oremeaUserId: userId, product, code,
  });
  return Boolean(result && typeof result === "object" && "connected" in result &&
    result.connected === true);
}

/** Missing or revoked connection returns no data, never other household records */
export async function getSharedSustainReferences(
  userId: string,
  product: SustainProduct,
): Promise<SharedSustainReference[]> {
  const body = await callSustain("/integrations/oremea/export", { oremeaUserId: userId, product });
  if (!body || typeof body !== "object" || !("references" in body) || !Array.isArray(body.references))
    return [];

  return body.references.slice(0, 6)
    .filter((value): value is SharedSustainReference => Boolean(
      value && typeof value === "object" && typeof value.title === "string" &&
      typeof value.content === "string" &&
      value.title.length <= 80 && value.content.length <= 1500,
    ))
    .map(value => ({ title: value.title.trim(), content: value.content.trim() }))
    .filter(value => Boolean(value.title && value.content));
}
