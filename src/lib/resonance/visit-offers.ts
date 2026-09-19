import { OREMEA_PRICING } from "../oremea/pricing";

export const VISIT_PRICES = OREMEA_PRICING.resonance.visitPricesCents;
export const INITIAL_QUANTITIES = OREMEA_PRICING.resonance.featuredVisitQuantities;
export type InitialQuantity = (typeof INITIAL_QUANTITIES)[number];
export type VisitQuantity = keyof typeof VISIT_PRICES;
export type VisitOffer = {
  kind: "initial" | "completion" | "smaller";
  quantity: VisitQuantity;
  amountCents: number;
};

export function isInitialQuantity(value: number): value is InitialQuantity {
  return INITIAL_QUANTITIES.some((quantity) => quantity === value);
}

export function initialOffer(quantity: number): VisitOffer {
  if (!isInitialQuantity(quantity)) throw new Error("Invalid initial package.");
  return { kind: "initial", quantity, amountCents: VISIT_PRICES[quantity] };
}

export function additionalOffers(initialQuantity: number): VisitOffer[] {
  if (!isInitialQuantity(initialQuantity)) throw new Error("Invalid initial package.");
  const remaining = (10 - initialQuantity) as VisitQuantity;
  const amountCents = VISIT_PRICES[10] - VISIT_PRICES[initialQuantity];
  const smaller = (Object.keys(VISIT_PRICES).map(Number) as VisitQuantity[])
    .filter((quantity) => {
      const intentionalFivePackComparison =
        initialQuantity === 4 && quantity === 5 && VISIT_PRICES[quantity] === amountCents;
      return (
        quantity < remaining &&
        (VISIT_PRICES[quantity] < amountCents || intentionalFivePackComparison)
      );
    })
    .map((quantity): VisitOffer => ({ kind: "smaller", quantity, amountCents: VISIT_PRICES[quantity] }));
  return [{ kind: "completion", quantity: remaining, amountCents }, ...smaller];
}

export function offerPlanEnv(offer: VisitOffer, initialQuantity?: number) {
  return offer.kind === "completion"
    ? `WHOP_RESONANCE_COMPLETE_FROM_${initialQuantity}_PLAN_ID`
    : `WHOP_RESONANCE_VISITS_${offer.quantity}_PLAN_ID`;
}

export function visitsEnabled() {
  return process.env.RESONANCE_VISITS_ENABLED === "true";
}

export function visitCheckoutEnabled() {
  return visitsEnabled() && process.env.RESONANCE_VISITS_CHECKOUT_ENABLED === "true";
}

