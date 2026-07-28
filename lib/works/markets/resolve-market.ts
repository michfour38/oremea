import type { WorksMarketConfig } from "./config";
import { southAfricaMarket } from "./za";

const marketsBySlug: Record<string, WorksMarketConfig> = {
  [southAfricaMarket.slug]: southAfricaMarket,
};

export function resolveWorksMarket(slug: string): WorksMarketConfig | null {
  return marketsBySlug[slug.toLowerCase()] ?? null;
}

export function getActiveWorksMarkets(): WorksMarketConfig[] {
  return Object.values(marketsBySlug).filter((market) => market.active);
}
