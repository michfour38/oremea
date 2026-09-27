import {
  oremeaDawnCommerceMetrics,
  unavailableDawnCommerceMetrics,
} from "./dawn-commerce-metrics";
import { oremeaProductTruthSnapshot } from "./product-truth";
import { observeWhopVisitEconomics } from "../whop/affiliate-economics-observer";

export async function oremeaDawnTruthSnapshot() {
  const productTruth = oremeaProductTruthSnapshot();

  try {
    const [commerceMetrics, providerEconomics] = await Promise.all([
      oremeaDawnCommerceMetrics(),
      observeWhopVisitEconomics().catch(() => ({ availability: "unavailable", financialExecution: false })),
    ]);
    return {
      ...productTruth,
      commerceMetrics: { ...commerceMetrics, providerEconomics },
    };
  } catch (error) {
    console.error("DAWN commerce telemetry could not be aggregated.", error);
    return {
      ...productTruth,
      commerceMetrics: unavailableDawnCommerceMetrics(),
    };
  }
}
