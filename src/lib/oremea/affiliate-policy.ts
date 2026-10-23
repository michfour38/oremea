/** Owner policy. Whop executes commissions and owns individual creator approval. */
export const OREMEA_AFFILIATE_POLICY = {
  schemaVersion: 4,
  authority: "oremea_repository",
  executionAuthority: "whop",
  standardRate: 0.70,
  approvedCreatorRate: 0.70,
  creatorApproval: "owner_only_in_whop",
  subscriptionCommission: "whop_recurring_payments",
  dawnAuthority: "aggregate_observation_only",
  dawnIncomeAllocation: 0,
} as const;
