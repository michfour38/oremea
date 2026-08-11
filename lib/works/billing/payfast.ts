import { createHash, timingSafeEqual } from "crypto";
import { resolve4 } from "dns/promises";
import { isIP } from "net";

const LIVE_HOST = "www.payfast.co.za";
const SANDBOX_HOST = "sandbox.payfast.co.za";
const API_HOST = "https://api.payfast.co.za";
const VALID_PAYFAST_HOSTS = [
  LIVE_HOST,
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
  SANDBOX_HOST,
] as const;

// Current PayFast-published server ranges. DNS resolution below is also checked
// so normal host changes do not depend on a single static list.
const VALID_PAYFAST_CIDRS = [
  "197.97.145.144/28",
  "41.74.179.192/27",
  "102.216.36.0/28",
  "102.216.36.128/28",
  "144.126.193.139/32",
] as const;

export type PayfastCheckoutFields = Record<string, string>;

function formEncode(value: string) {
  const encoded = new URLSearchParams([["value", value.trim()]]).toString();
  return encoded.slice("value=".length);
}

function md5(value: string) {
  return createHash("md5").update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left.toLowerCase());
  const b = Buffer.from(right.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isPayfastSandbox() {
  return process.env.PAYFAST_SANDBOX?.trim().toLowerCase() === "true";
}

export function getPayfastConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim() || "";
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY?.trim() || "";
  const passphrase = process.env.PAYFAST_PASSPHRASE?.trim() || "";
  const publicUrl = (process.env.WORKS_PUBLIC_URL?.trim() || "https://works.oremea.com").replace(/\/$/, "");

  if (!merchantId || !merchantKey || !passphrase) {
    throw new Error("WORKS PayFast billing is not configured.");
  }

  return {
    merchantId,
    merchantKey,
    passphrase,
    publicUrl,
    sandbox: isPayfastSandbox(),
  };
}

export function payfastPaymentSignature(
  fields: PayfastCheckoutFields,
  passphrase: string,
) {
  const pairs = Object.entries(fields)
    .filter(([key, value]) => key !== "signature" && value !== "")
    .map(([key, value]) => `${key}=${formEncode(value)}`);
  pairs.push(`passphrase=${formEncode(passphrase)}`);
  return md5(pairs.join("&"));
}

export function buildWorksPayfastCheckout(params: {
  merchantPaymentId: string;
  planName: string;
  amountCents: number;
}) {
  const config = getPayfastConfig();
  const amount = (params.amountCents / 100).toFixed(2);
  const fields: PayfastCheckoutFields = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${config.publicUrl}/provider/billing?payment=returned`,
    cancel_url: `${config.publicUrl}/provider/billing?payment=cancelled`,
    notify_url: `${config.publicUrl}/api/works/billing/payfast/itn`,
    m_payment_id: params.merchantPaymentId,
    amount,
    item_name: `WORKS ${params.planName}`,
    item_description: `WORKS ${params.planName} provider plan`,
    subscription_type: "1",
    recurring_amount: amount,
    frequency: "3",
    cycles: "0",
  };

  fields.signature = payfastPaymentSignature(fields, config.passphrase);

  return {
    action: `https://${config.sandbox ? SANDBOX_HOST : LIVE_HOST}/eng/process`,
    fields,
  };
}

export function parsePayfastItn(rawBody: string) {
  const params = new URLSearchParams(rawBody);
  const data: Record<string, string> = {};
  const signaturePairs: string[] = [];

  for (const [key, value] of params.entries()) {
    data[key] = value;
    if (key !== "signature" && value !== "") {
      signaturePairs.push(`${key}=${formEncode(value)}`);
    }
  }

  return {
    data,
    parameterString: signaturePairs.join("&"),
  };
}

export function verifyPayfastItnSignature(params: {
  data: Record<string, string>;
  parameterString: string;
  passphrase: string;
}) {
  const supplied = params.data.signature?.trim() || "";
  if (!supplied) return false;
  const expected = md5(
    `${params.parameterString}&passphrase=${formEncode(params.passphrase)}`,
  );
  return safeEqual(supplied, expected);
}

export function payfastEventKey(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

export function payfastAmountToCents(value: string | undefined) {
  const cleaned = value?.trim() || "";
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

function ipv4ToNumber(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return (((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256 + parts[3]) >>> 0;
}

function inCidr(ip: string, cidr: string) {
  const [base, prefixText] = cidr.split("/");
  const ipNumber = ipv4ToNumber(ip);
  const baseNumber = ipv4ToNumber(base);
  const prefix = Number(prefixText);
  if (ipNumber == null || baseNumber == null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNumber & mask) === (baseNumber & mask);
}

function normalizeIp(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("::ffff:") ? trimmed.slice(7) : trimmed;
}

export function requestClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  const value =
    forwarded ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "";
  const ip = normalizeIp(value);
  return isIP(ip) ? ip : null;
}

export async function verifyPayfastSource(request: Request) {
  const clientIp = requestClientIp(request);
  if (!clientIp || isIP(clientIp) !== 4) return false;

  if (VALID_PAYFAST_CIDRS.some((cidr) => inCidr(clientIp, cidr))) {
    return true;
  }

  const lookups = await Promise.allSettled(
    VALID_PAYFAST_HOSTS.map((hostname) => resolve4(hostname)),
  );
  const resolved = new Set<string>();
  for (const result of lookups) {
    if (result.status === "fulfilled") {
      for (const ip of result.value) resolved.add(ip);
    }
  }
  return resolved.has(clientIp);
}

export async function verifyPayfastServerConfirmation(parameterString: string) {
  const sandbox = isPayfastSandbox();
  const response = await fetch(
    `https://${sandbox ? SANDBOX_HOST : LIVE_HOST}/eng/query/validate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: parameterString,
      cache: "no-store",
    },
  );
  if (!response.ok) return false;
  return (await response.text()).trim() === "VALID";
}

function apiTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

function payfastApiSignature(values: Record<string, string>, passphrase: string) {
  const entries = Object.entries({ ...values, passphrase })
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right));
  return md5(entries.map(([key, value]) => `${key}=${formEncode(value)}`).join("&"));
}

export async function cancelPayfastSubscription(token: string) {
  const config = getPayfastConfig();
  const timestamp = apiTimestamp();
  const signature = payfastApiSignature(
    {
      "merchant-id": config.merchantId,
      timestamp,
      version: "v1",
    },
    config.passphrase,
  );
  const query = config.sandbox ? "?testing=true" : "";
  const response = await fetch(
    `${API_HOST}/subscriptions/${encodeURIComponent(token)}/cancel${query}`,
    {
      method: "PUT",
      headers: {
        "merchant-id": config.merchantId,
        version: "v1",
        timestamp,
        signature,
      },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null) as {
    code?: number;
    status?: string;
    data?: { response?: boolean };
  } | null;

  return Boolean(
    response.ok &&
      payload?.status === "success" &&
      payload?.data?.response === true,
  );
}
