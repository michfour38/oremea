// No rate or approval is accepted from a browser. Whop resolves both.
export const AFFILIATE_COOKIE = "oremea_whop_affiliate";

export function affiliateCode(value: unknown): string | null {
  return typeof value === "string" && /^[a-zA-Z0-9_.-]{1,100}$/.test(value)
    ? value : null;
}

export function affiliateCheckoutUrl(href: string | null, code: unknown) {
  const referral = affiliateCode(code);
  if (!href || !referral) return href;
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" || !["whop.com", "www.whop.com"].includes(url.hostname)) return href;
    url.searchParams.set("a", referral);
    return url.toString();
  } catch { return href; }
}
