export const WORKS_PRODUCT_STAGES = [
  "IDEA",
  "FORMULA_READY",
  "SELF_MAKING",
  "CURRENT_MANUFACTURER",
  "SCALING",
] as const;

export type WorksProductStage = (typeof WORKS_PRODUCT_STAGES)[number];

export const WORKS_EXISTING_ASSETS = [
  "FORMULA",
  "PROTOTYPE",
  "INGREDIENTS",
  "PACKAGING",
  "BRANDING",
  "TESTING",
  "CERTIFICATIONS",
  "REGULATORY",
  "ORDERS",
] as const;

export type WorksExistingAsset = (typeof WORKS_EXISTING_ASSETS)[number];

export const WORKS_LOCATION_PREFERENCES = [
  "ANYWHERE_MARKET",
  "PREFER_AREA",
  "MUST_AREA",
] as const;

export type WorksLocationPreference = (typeof WORKS_LOCATION_PREFERENCES)[number];

export function isWorksProductStage(value: string): value is WorksProductStage {
  return WORKS_PRODUCT_STAGES.includes(value as WorksProductStage);
}

export function isWorksExistingAsset(value: string): value is WorksExistingAsset {
  return WORKS_EXISTING_ASSETS.includes(value as WorksExistingAsset);
}

export function isWorksLocationPreference(value: string): value is WorksLocationPreference {
  return WORKS_LOCATION_PREFERENCES.includes(value as WorksLocationPreference);
}
