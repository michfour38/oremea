import { OREMEA_PRICING } from "./pricing";

const ceilRate = (amountCents: number, rate: number) =>
  Math.ceil(amountCents * rate);

/**
 * Conservative reserve model for referred creator sales.
 *
 * This is NOT a representation of a provider invoice. Oremea's read-only Whop
 * economics observer remains the source for observed provider records. These
 * reserves answer: "Does a referred sale still work economically if the buyer
 * never purchases again?"
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

/**
 * Historical constant name retained for callers. Launch policy is now simple:
 * every customer sees the normal Oremea price ladder, standard affiliates earn
 * 30%, and specifically approved creators earn 40% from the first attributable
 * sale onward. There is no creator-only customer discount and no 100% first sale.
 */
export const CREATOR_ACQUISITION_POLICY = {
  schemaVersion: 2,
  acquisitionProductKey: "resonance_standard_catalog",
  customerPriceCents: OREMEA_PRICING.resonance.visitPricesCents[1],
  creatorFrontEndRate: 0.40,
  creatorBackendRate: 0.40,
  standardAffiliateRate: 0.30,
  firstVisitDeliveryReserveCents: 500,
  dedicatedHiddenProviderProductRequired: false,
  neverApplyFrontEndRateToStandardResonanceCatalog: false,
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
  const creatorRate = CREATOR_ACQUISITION_POLICY.creatorBackendRate;
  const firstSaleCommissionCents = creatorCommissionReserveCents(
    CREATOR_ACQUISITION_POLICY.customerPriceCents,
    creatorRate,
  );
  const resonanceCompleteTenAmountCents =
    OREMEA_PRICING.resonance.visitPricesCents[10] -
    CREATOR_ACQUISITION_POLICY.customerPriceCents;
  const resonanceCompleteTenCreatorCommissionCents =
    creatorCommissionReserveCents(resonanceCompleteTenAmountCents, creatorRate);

  return {
    resonanceCompleteTenFromFirstVisit: {
      priceCents: resonanceCompleteTenAmountCents,
      creatorRate,
      creatorCommissionCents: resonanceCompleteTenCreatorCommissionCents,
      creatorEarningsAcrossTenCents:
        firstSaleCommissionCents + resonanceCompleteTenCreatorCommissionCents,
      maxDeliveryBudgetCents: maxDeliveryBudgetCents({
        amountCents: resonanceCompleteTenAmountCents,
        creatorRate,
        includeRefundDisputeReserve: true,
      }),
      remainingVisits: 9,
    },
    recognitionFirstMonth: {
      priceCents: OREMEA_PRICING.recognition.standardPriceCents,
      creatorRate,
      maxDeliveryBudgetCents: maxDeliveryBudgetCents({
        amountCents: OREMEA_PRICING.recognition.standardPriceCents,
        creatorRate,
        recurring: true,
      }),
    },
    compassFirstMonth: {
      priceCents: OREMEA_PRICING.compass.standardPriceCents,
      creatorRate,
      maxDeliveryBudgetCents: maxDeliveryBudgetCents({
        amountCents: OREMEA_PRICING.compass.standardPriceCents,
        creatorRate,
        recurring: true,
      }),
    },
  } as const;
}
