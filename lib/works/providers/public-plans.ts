export type WorksProviderPlanKey = "FREE" | "VERIFIED" | "GROWTH";

export type WorksProviderPlan = {
  key: WorksProviderPlanKey;
  name: string;
  priceMonthlyZar: number;
  priceLabel: string;
  detail: string;
  features: readonly string[];
  recommended?: boolean;
};

/**
 * Canonical public commercial description for WORKS provider plans.
 *
 * Keep price, naming and included public features here rather than in route
 * components. Billing identifiers deliberately do not live in public UI code.
 */
export const WORKS_PROVIDER_PLANS: readonly WorksProviderPlan[] = [
  {
    key: "FREE",
    name: "Free",
    priceMonthlyZar: 0,
    priceLabel: "R0",
    detail:
      "A public business profile that can enter customer matching once its capability has been structured.",
    features: [
      "Searchable public business profile",
      "Eligible for matching after capability setup",
      "Keep core business information visible",
      "Customer reviews can appear on your public profile",
    ],
  },
  {
    key: "VERIFIED",
    name: "Active",
    priceMonthlyZar: 599,
    priceLabel: "R599 / month",
    detail:
      "Receive suitable WORKS opportunities once capability fit is established, and keep capacity and availability current.",
    features: [
      "Everything in Free",
      "Matched opportunities sent to your WORKS inbox",
      "Capability, capacity and availability controls",
      "Business response workspace",
      "Customer reviews on your public profile",
    ],
    recommended: true,
  },
  {
    key: "GROWTH",
    name: "Growth",
    priceMonthlyZar: 1999,
    priceLabel: "R1,999 / month",
    detail:
      "Choose the capabilities and capacity you want to grow, and let WORKS actively create demand around them.",
    features: [
      "Everything in Active",
      "Active demand generation around selected capabilities",
      "Choose the categories and work you want more of",
      "Demand insights as WORKS data grows",
      "Customer reviews on your public profile",
    ],
  },
] as const;

export function resolveWorksProviderPlan(plan: string | null | undefined) {
  return WORKS_PROVIDER_PLANS.find((item) => item.key === plan) ?? WORKS_PROVIDER_PLANS[0];
}
