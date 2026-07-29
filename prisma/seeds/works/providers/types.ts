import type { Prisma } from "@prisma/client";

export type ProviderLocationSeed = {
  key: string;
  label?: string;
  locationType?: string;
  addressLine1?: string;
  addressLine2?: string;
  administrativeArea?: string;
  locality?: string;
  postalCode?: string;
  isPrimary?: boolean;
};

export type ProviderSourceSeed = {
  key: string;
  name: string;
  url: string;
};

export type ProviderClaimSeed = {
  field: string;
  claimType: string;
  value: Prisma.InputJsonValue;
  displayValue?: string;
  unit?: string;
  offeringSlug?: string;
  sourceKey: string;
  evidenceSummary: string;
  staleAfterDays?: number;
};

export type ProviderOfferingSeed = {
  name: string;
  slug: string;
  description?: string;
  productionModel?: string;
  moqValue?: number;
  moqUnit?: string;
  maxRunValue?: number;
  maxRunUnit?: string;
  leadTimeMinDays?: number;
  leadTimeMaxDays?: number;
  leadTimeBasis?: "WORKING_DAYS" | "CALENDAR_DAYS";
  sampleAvailable?: boolean;
  startupFriendly?: boolean;
  quoteRequired?: boolean;
  packagingSupplied?: boolean;
  clientPackagingAccepted?: boolean;
  categories: string[];
  services?: string[];
  capabilities?: string[];
  packagingFormats?: string[];
  sourceKey?: string;
  evidenceSummary?: string;
};

export type ProviderSeed = {
  name: string;
  slug: string;
  legalName?: string;
  website: string;
  email?: string;
  phone?: string;
  description?: string;
  administrativeArea?: string;
  locality?: string;
  servesNationally?: boolean;
  acceptsRemoteClients?: boolean;
  exports?: boolean;
  exportRegions?: string[];
  types: string[];
  locations?: ProviderLocationSeed[];
  sources: ProviderSourceSeed[];
  offerings: ProviderOfferingSeed[];
  claims?: ProviderClaimSeed[];
};
