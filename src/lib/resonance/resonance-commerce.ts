const RESONANCE_ROOM_COUNT = 10;

export function getResonanceCheckoutUrl(weekNumber: number) {
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > RESONANCE_ROOM_COUNT) {
    return null;
  }

  const specific = process.env[`RESONANCE_WEEK_${weekNumber}_CHECKOUT_URL`]?.trim();
  if (specific) return specific;

  return process.env.RESONANCE_WEEK_CHECKOUT_URL?.trim() || null;
}

export function getResonanceWeekForWhopProduct(productId: string) {
  const normalized = productId.trim();
  if (!normalized) return null;

  for (let weekNumber = 1; weekNumber <= RESONANCE_ROOM_COUNT; weekNumber += 1) {
    if (process.env[`WHOP_RESONANCE_WEEK_${weekNumber}_PRODUCT_ID`]?.trim() === normalized) {
      return weekNumber;
    }
  }

  return null;
}
