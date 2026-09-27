import { cookies } from "next/headers";
import { AFFILIATE_COOKIE, affiliateCode } from "./affiliate-attribution";

export async function requestAffiliateCode() {
  return affiliateCode((await cookies()).get(AFFILIATE_COOKIE)?.value);
}
