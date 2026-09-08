export type MemberNavProduct = "recognition" | "resonance" | "compass"

const PRODUCT_BY_HOSTNAME: Record<string, MemberNavProduct> = {
  "recognition.oremea.com": "recognition",
  "resonance.oremea.com": "resonance",
  "compass.oremea.com": "compass",
}

function matchesProductPath(pathname: string, product: MemberNavProduct) {
  const productPath = `/${product}`

  return pathname === productPath || pathname.startsWith(`${productPath}/`)
}

export function resolveMemberNavProduct({
  hostname,
  pathname,
}: {
  hostname?: string
  pathname: string
}): MemberNavProduct | null {
  const normalizedHostname = hostname
    ?.split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase()

  if (normalizedHostname && PRODUCT_BY_HOSTNAME[normalizedHostname]) {
    return PRODUCT_BY_HOSTNAME[normalizedHostname]
  }

  if (matchesProductPath(pathname, "recognition")) return "recognition"
  if (matchesProductPath(pathname, "resonance")) return "resonance"
  if (matchesProductPath(pathname, "compass")) return "compass"

  return null
}
