export const WHOP_API_BASE = "https://api.whop.com/api/v1";
export const WHOP_VISIT_API_VERSION = "2025-01-01";

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
    throw new Error(`Whop request returned ${response.status}.`);
  }
  return response.json() as Promise<unknown>;
}
