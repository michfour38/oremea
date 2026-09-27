import { OREMEA_AFFILIATE_POLICY } from "./affiliate-policy";

export type AffiliateChannel = "direct" | "standard" | "approved_creator";
export type TransactionCosts = {
  platformAndPaymentCents: number | null;
  affiliateProcessingCents: number | null;
  taxAndRemittanceCents: number | null;
  refundsAndDisputesCents: number | null;
};

/** Planning only: never grants a rate, credits a commission, or moves money.
 * Gross includes any collected tax; costs must be non-overlapping ledger values.
 * Unknown fees remain unknown, never zero. Commission reversals belong in the
 * supplied measured commission, not in a second refund deduction.
 */
export function affiliateEconomics(grossCents: number, channel: AffiliateChannel,
  costs: TransactionCosts, measuredCommissionCents?: number) {
  if (!Number.isSafeInteger(grossCents) || grossCents < 0) throw new Error("Invalid gross amount.");
  const rate = channel === "direct" ? 0 : channel === "standard"
    ? OREMEA_AFFILIATE_POLICY.standardRate : OREMEA_AFFILIATE_POLICY.approvedCreatorRate;
  const commissionCents = measuredCommissionCents ?? Math.round(grossCents * rate);
  for (const amount of [commissionCents, ...Object.values(costs)]) {
    if (amount !== null && (!Number.isSafeInteger(amount) || amount < 0)) throw new Error("Invalid transaction cost.");
  }
  const complete = Object.values(costs).every(value => value !== null);
  return {
    grossCents, channel, commissionCents,
    commissionBasis: measuredCommissionCents === undefined ? "policy_estimate" : "measured_whop",
    costs,
    retainedRevenueCents: complete ? grossCents - commissionCents - Object.values(costs).reduce<number>((sum, value) => sum + (value ?? 0), 0) : null,
    retainedRevenueBasis: complete ? "provided_costs" : "incomplete_costs",
  };
}
