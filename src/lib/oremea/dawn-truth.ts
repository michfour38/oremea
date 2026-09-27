import {
  oremeaDawnCommerceMetrics,
  unavailableDawnCommerceMetrics,
} from "./dawn-commerce-metrics";
import { oremeaProductTruthSnapshot } from "./product-truth";

export async function oremeaDawnTruthSnapshot() {
  const productTruth = oremeaProductTruthSnapshot();

  try {
    return {
      ...productTruth,
      commerceMetrics: await oremeaDawnCommerceMetrics(),
    };
  } catch (error) {
    console.error("DAWN commerce telemetry could not be aggregated.", error);
    return {
      ...productTruth,
      commerceMetrics: unavailableDawnCommerceMetrics(),
    };
  }
}
