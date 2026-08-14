export type CompassWhopAccess = "30_day_pass" | "monthly_subscription";

function configuredCompassProductId() {
  return process.env.WHOP_COMPASS_PRODUCT_ID?.trim() || "";
}

function configuredCompassPassPlanId() {
  return process.env.WHOP_COMPASS_PASS_PLAN_ID?.trim() || "";
}

function configuredCompassSubscriptionPlanId() {
  return process.env.WHOP_COMPASS_SUBSCRIPTION_PLAN_ID?.trim() || "";
}

export function getCompassWhopAccessForPlan(
  productId: string,
  planId: string,
): CompassWhopAccess | null {
  const normalizedProductId = productId.trim();
  const normalizedPlanId = planId.trim();
  const productIdExpected = configuredCompassProductId();

  if (
    !normalizedProductId ||
    !normalizedPlanId ||
    !productIdExpected ||
    normalizedProductId !== productIdExpected
  ) {
    return null;
  }

  const passPlanId = configuredCompassPassPlanId();
  if (passPlanId && normalizedPlanId === passPlanId) {
    return "30_day_pass";
  }

  const subscriptionPlanId = configuredCompassSubscriptionPlanId();
  if (subscriptionPlanId && normalizedPlanId === subscriptionPlanId) {
    return "monthly_subscription";
  }

  return null;
}

export function isCompassPassFulfillmentConfigured() {
  return Boolean(configuredCompassProductId() && configuredCompassPassPlanId());
}

export function isCompassSubscriptionFulfillmentConfigured() {
  return Boolean(
    configuredCompassProductId() && configuredCompassSubscriptionPlanId(),
  );
}
