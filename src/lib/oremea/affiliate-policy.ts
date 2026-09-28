import { CREATOR_ACQUISITION_POLICY } from "./creator-acquisition-economics";

/** Owner policy. Whop executes commissions and owns individual creator approval. */
export const OREMEA_AFFILIATE_POLICY = {
  schemaVersion: 3,
  authority: "oremea_repository",
  executionAuthority: "whop",
  standardRate: CREATOR_ACQUISITION_POLICY.standardAffiliateRate,
  approvedCreatorRate: CREATOR_ACQUISITION_POLICY.creatorBackendRate,
  creatorAcquisition: {
    productKey: CREATOR_ACQUISITION_POLICY.acquisitionProductKey,
    customerPriceCents: CREATOR_ACQUISITION_POLICY.customerPriceCents,
    firstSaleRate: CREATOR_ACQUISITION_POLICY.creatorFrontEndRate,
    backendRate: CREATOR_ACQUISITION_POLICY.creatorBackendRate,
    dedicatedHiddenProviderProductRequired:
      CREATOR_ACQUISITION_POLICY.dedicatedHiddenProviderProductRequired,
    neverApplyFirstSaleRateToStandardResonanceCatalog:
      CREATOR_ACQUISITION_POLICY.neverApplyFrontEndRateToStandardResonanceCatalog,
  },
  creatorApproval: "owner_only_in_whop",
  subscriptionCommission: "whop_recurring_payments",
  customerPricing: "same_catalog_for_direct_affiliate_and_creator_traffic",
  creatorSpecificDiscount: false,
  dawnAuthority: "aggregate_observation_only",
  dawnIncomeAllocation: 0,
} as const;
