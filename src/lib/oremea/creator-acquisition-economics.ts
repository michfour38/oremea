import { OREMEA_PRICING } from "./pricing";

const ceilRate = (amountCents: number, rate: number) =>
  Math.ceil(amountCents * rate);

/**
 * Deliberately conservative reserve model for creator acquisition.
 *
 * This is NOT a representation of a provider invoice. Oremea's read-only Whop
 * economics observer remains the source for observed provider records. These
 * reserves answer a different question: "What must still work if a referred
 * customer is expensive to process and leaves after the first purchase?"
 *
 * Public Whop pricing checked 2026-09-28:
 * - card processing 2.7% + $0.30
 * - international card surcharge 1.5%
 * - currency conversion 1%
 * - tax service 2% when tax is collected
 * - affiliate processing 1.25%
 * - recurring billing 0.5%
 *
 * We stack the variable fees for the stress case even though not every sale
 * incurs every fee. Actual economics must later be reconciled to provider data.
 */
export const CREATOR_ECONOMICS_RESERVE = {
  domesticCardRate: 0.027,
  internationalCardRate: 0.015,
  currencyConversionRate: 0.01,
  taxServiceRate: 0.02,
  affiliateProcessingRate: 0.0125,
  recurringBillingRate: 0.005,
  fixedPaymentCents: 30,
  refundDisputeReserveRate: 0.05,
  targetContributionMarginRate: 0.20,
} as const;

export const CREATOR_ACQUISITION_POLICY = {
  schemaVersion: 1,
  acquisitionProductKey: "resonance_creator_starter",
  customerPriceCents: OREMEA_PRICING.resonance.visitPricesCents[1],
  creatorFrontEndRate: 1,
  creatorBackendRate: 0.40,
  standardAffiliateRate: 0.30,
  firstVisitDeliveryReserveCents: 500,
  dedicatedHiddenProviderProductRequired: true,
  neverApplyFrontEndRateToStandardResonanceCatalog: true,
  ownerApprovalRequired: true,
  financialExecution: false,
} as const;

export function conservativeProviderFeeReserveCents(
  amountCents: number,
  { recurring = false }: { recurring?: boolean } = {},
) {
  const variableRate =
    CREATOR_ECONOMICS_RESERVE.domesticCardRate +
    CREATOR_ECONOMICS_RESERVE.internationalCardRate +
    CREATOR_ECONOMICS_RESERVE.currencyConversionRate +
    CREATOR_ECONOMICS_RESERVE.taxServiceRate +
    CREATOR_ECONOMICS_RESERVE.affiliateProcessingRate +
    (recurring ? CREATOR_ECONOMICS_RESERVE.recurringBillingRate : 0);

  return ceilRate(amountCents, variableRate) +
    CREATOR_ECONOMICS_RESERVE.fixedPaymentCents;
}

export function creatorCommissionReserveCents(
  amountCents: number,
  rate: number,
) {
  return ceilRate(amountCents, rate);
}

export function refundDisputeReserveCents(amountCents: number) {
  return ceilRate(
    amountCents,
    CREATOR_ECONOMICS_RESERVE.refundDisputeReserveRate,
  );
}

export function targetContributionReserveCents(amountCents: number) {
  return ceilRate(
    amountCents,
    CREATOR_ECONOMICS_RESERVE.targetContributionMarginRate,
  );
}

export function maxDeliveryBudgetCents({
  amountCents,
  creatorRate,
  recurring = false,
  includeRefundDisputeReserve = false,
}: {
  amountCents: number;
  creatorRate: number;
  recurring?: boolean;
  includeRefundDisputeReserve?: boolean;
}) {
  return Math.max(
    0,
    amountCents -
      creatorCommissionReserveCents(amountCents, creatorRate) -
      conservativeProviderFeeReserveCents(amountCents, { recurring }) -
      targetContributionReserveCents(amountCents) -
      (includeRefundDisputeReserve
        ? refundDisputeReserveCents(amountCents)
        : 0),
  );
}

export function creatorAcquisitionStressCase() {
  const amountCents = CREATOR_ACQUISITION_POLICY.customerPriceCents;
  const creatorCommissionCents = creatorCommissionReserveCents(
    amountCents,
    CREATOR_ACQUISITION_POLICY.creatorFrontEndRate,
  );
  const providerFeeReserveCents = conservativeProviderFeeReserveCents(
    amountCents,
  );
  const refundReserveCents = refundDisputeReserveCents(amountCents);
  const deliveryReserveCents =
    CREATOR_ACQUISITION_POLICY.firstVisitDeliveryReserveCents;
  const contributionCents =
    amountCents -
    creatorCommissionCents -
    providerFeeReserveCents -
    refundReserveCents -
    deliveryReserveCents;

  return {
    amountCents,
    creatorCommissionCents,
    providerFeeReserveCents,
    refundDisputeReserveCents: refundReserveCents,
    deliveryReserveCents,
    contributionCents,
    acquisitionInvestmentCents: Math.max(0, -contributionCents),
    commissionBasisAssumption: "gross_sale_stress_case",
  } as const;
}

export function creatorBackendStressCases() {
  const backendRate = CREATOR_ACQUISITION_POLICY.creatorBackendRate;
  const resonanceCompleteTenAmountCents =
    OREMEA_PRICING.resonance.visitPricesCents[10] -
    CREATOR_ACQUISITION_POLICY.customerPriceCents;
  const resonanceCompleteTenCreatorCommissionCents =
    creatorCommissionReserveCents(resonanceCompleteTenAmountCents, backendRate);

  return {
    resonanceCompleteTenFromStarter: {
      priceCents: resonanceCompleteTenAmountCents,
      creatorRate: backendRate,
      creatorCommissionCents: resonanceCompleteTenCreatorCommissionCents,
      creatorEarningsIncludingStarterCents:
        CREATOR_ACQUISITION_POLICY.customerPriceCents +
        resonanceCompleteTenCreatorCommissionCents,
      maxDeliveryBudgetCents: maxDeliveryBudgetCents({
        amountCents: resonanceCompleteTenAmountCents,
        creatorRate: backendRate,
        includeRefundDisputeReserve: true,
      }),
      remainingVisits: 9,
    },
    recognitionFirstMonth: {
      priceCents: OREMEA_PRICING.recognition.standardPriceCents,
      creatorRate: backendRate,
      maxDeliveryBudgetCents: maxDeliveryBudgetCents({
        amountCents: OREMEA_PRICING.recognition.standardPriceCents,
        creatorRate: backendRate,
        recurring: true,
      }),
    },
    compassFirstMonth: {
      priceCents: OREMEA_PRICING.compass.standardPriceCents,
      creatorRate: backendRate,
      maxDeliveryBudgetCents: maxDeliveryBudgetCents({
        amountCents: OREMEA_PRICING.compass.standardPriceCents,
        creatorRate: backendRate,
        recurring: true,
      }),
    },
  } as const;
}
