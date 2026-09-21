export const WHOP_API_BASE = "https://api.whop.com/api/v1";
export const WHOP_VISIT_API_VERSION = "2025-01-01";

export type WhopFailureDetails = {
  code?: string;
  message?: string;
  requestId?: string;
};

// Only these bounded, redacted fields may reach the authenticated admin UI.
// Keep Error.message generic for all customer-facing callers.
function safeDetail(value: unknown, apiKey: string, limit: number): string | undefined {
  if (typeof value !== "string") return undefined;
  let text = value;
  for (const secret of [apiKey, encodeURIComponent(apiKey)]) {
    if (secret) text = text.split(secret).join("[redacted]");
  }
  return text
    .replace(/Bearer\s+[^\s"'<>;,]+/gi, "Bearer [redacted]")
    .replace(/\b(?:apik|whsec|sk|pk)_[a-zA-Z0-9_.-]+/g, "[redacted]")
    .replace(/\beyJ[a-zA-Z0-9_.-]+/g, "[redacted]")
    .replace(/((?:api[_ -]?key|authorization|token|secret|password)\s*["']?\s*[:=]\s*["']?)[^\s"'<>;,]+/gi, (_match, prefix: string) => prefix + "[redacted]")
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL removed]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email removed]")
    .replace(/[a-zA-Z0-9_+\/-]{40,}={0,2}/g, "[redacted]")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, limit) || undefined;
}

async function failureDetails(response: Response, apiKey: string): Promise<WhopFailureDetails> {
  const details: WhopFailureDetails = {
    requestId: safeDetail(response.headers.get("x-request-id") ?? response.headers.get("request-id"), apiKey, 128),
  };
  // Do not retain arbitrary bodies (HTML proxies, payment/customer payloads, etc.).
  if (!response.headers.get("content-type")?.includes("application/json")) return details;
  const reader = response.body?.getReader();
  if (!reader) return details;
  try {
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 16_384) {
        await reader.cancel();
        return details;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body)) return details;
    const envelope = body as Record<string, unknown>;
    const error = envelope.error;
    const source = error && typeof error === "object" && !Array.isArray(error)
      ? error as Record<string, unknown> : envelope;
    details.code = safeDetail(source.code ?? source.type, apiKey, 128);
    details.message = safeDetail(source.message ?? (typeof error === "string" ? error : undefined), apiKey, 800);
  } catch {
    // A malformed/unreadable error body must not replace the original HTTP status.
  } finally {
    reader.releaseLock();
  }
  return details;
}

export class WhopApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly details: WhopFailureDetails = {},
  ) {
    super(`Whop request returned ${status}.`);
    this.name = "WhopApiError";
  }
}

export function getOremeaCommerceOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.oremea.com";
  const origin = new URL(configured);
  if (origin.protocol !== "https:" && origin.hostname !== "localhost") {
    throw new Error("Commerce requires a secure application URL.");
  }
  return origin.origin;
}

export function getWhopApiKey() {
  const apiKey = process.env.WHOP_API_KEY?.trim();
  if (!apiKey) throw new Error("WHOP_API_KEY is not configured.");
  return apiKey;
}

export async function whopApiRequest(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH";
    body?: Record<string, unknown>;
    idempotencyKey?: string;
    apiKey?: string;
  } = {},
) {
  const apiKey = options.apiKey ?? getWhopApiKey();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Api-Version-Date": WHOP_VISIT_API_VERSION,
  };
  if (options.body) headers["Content-Type"] = "application/json";
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  const response = await fetch(`${WHOP_API_BASE}/${path.replace(/^\//, "")}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new WhopApiError(response.status, path, await failureDetails(response, apiKey));
  }
  return response.json() as Promise<unknown>;
}
