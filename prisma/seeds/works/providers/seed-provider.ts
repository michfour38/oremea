import {
  PrismaClient,
  WorksClaimStatus,
  WorksEvidenceType,
  WorksProviderProfileStatus,
  WorksProviderSourceType,
  WorksVerificationMethod,
} from "@prisma/client";

import type { ProviderClaimSeed, ProviderSeed } from "./types";

const prisma = new PrismaClient();
const RESEARCH_DATE = new Date("2026-07-29T00:00:00.000Z");

function staleDate(days?: number) {
  if (!days) return null;
  return new Date(RESEARCH_DATE.getTime() + days * 86_400_000);
}

async function seedClaim(
  providerId: string,
  offeringIdBySlug: Map<string, string>,
  sourceIdByKey: Map<string, string>,
  definition: ProviderClaimSeed
) {
  const offeringId = definition.offeringSlug
    ? offeringIdBySlug.get(definition.offeringSlug)
    : null;

  if (definition.offeringSlug && !offeringId) {
    throw new Error(`Missing offering ${definition.offeringSlug} for claim ${definition.field}.`);
  }

  const sourceId = sourceIdByKey.get(definition.sourceKey);
  if (!sourceId) {
    throw new Error(`Missing source ${definition.sourceKey} for claim ${definition.field}.`);
  }

  const current = await prisma.works_claims.findFirst({
    where: {
      provider_id: providerId,
      offering_id: offeringId,
      field: definition.field,
      is_current: true,
    },
    orderBy: { created_at: "desc" },
  });

  const sameValue =
    current && JSON.stringify(current.value) === JSON.stringify(definition.value);

  let claimId: string;

  if (current && sameValue) {
    const updated = await prisma.works_claims.update({
      where: { id: current.id },
      data: {
        claim_type: definition.claimType,
        display_value: definition.displayValue,
        unit: definition.unit,
        status: WorksClaimStatus.SOURCE_CONFIRMED,
        verification_method: WorksVerificationMethod.SOURCE_REVIEW,
        verified_at: RESEARCH_DATE,
        stale_after: staleDate(definition.staleAfterDays),
      },
      select: { id: true },
    });
    claimId = updated.id;
  } else {
    if (current) {
      await prisma.works_claims.update({
        where: { id: current.id },
        data: { is_current: false },
      });
    }

    const created = await prisma.works_claims.create({
      data: {
        provider_id: providerId,
        offering_id: offeringId,
        claim_type: definition.claimType,
        field: definition.field,
        value: definition.value,
        display_value: definition.displayValue,
        unit: definition.unit,
        status: WorksClaimStatus.SOURCE_CONFIRMED,
        verification_method: WorksVerificationMethod.SOURCE_REVIEW,
        verified_at: RESEARCH_DATE,
        stale_after: staleDate(definition.staleAfterDays),
        supersedes_claim_id: current?.id,
        is_current: true,
      },
      select: { id: true },
    });
    claimId = created.id;
  }

  const existingEvidence = await prisma.works_evidence.findFirst({
    where: {
      claim_id: claimId,
      source_id: sourceId,
      evidence_type: WorksEvidenceType.SOURCE_SNAPSHOT,
    },
    select: { id: true },
  });

  if (!existingEvidence) {
    await prisma.works_evidence.create({
      data: {
        claim_id: claimId,
        source_id: sourceId,
        evidence_type: WorksEvidenceType.SOURCE_SNAPSHOT,
        summary: definition.evidenceSummary,
        captured_at: RESEARCH_DATE,
        checked_at: RESEARCH_DATE,
        verified_by: "WORKS_RESEARCH",
      },
    });
  }
}

export async function seedWorksProvider(definition: ProviderSeed) {
  const market = await prisma.works_markets.findUniqueOrThrow({
    where: { code: "ZA" },
    select: { id: true },
  });

  const provider = await prisma.works_providers.upsert({
    where: { slug: definition.slug },
    update: {
      name: definition.name,
      legal_name: definition.legalName,
      website: definition.website,
      email: definition.email,
      phone: definition.phone,
      description: definition.description,
      profile_status: WorksProviderProfileStatus.RESEARCHED,
      last_profile_reviewed_at: RESEARCH_DATE,
    },
    create: {
      name: definition.name,
      slug: definition.slug,
      legal_name: definition.legalName,
      website: definition.website,
      email: definition.email,
      phone: definition.phone,
      description: definition.description,
      profile_status: WorksProviderProfileStatus.RESEARCHED,
      last_profile_reviewed_at: RESEARCH_DATE,
    },
    select: { id: true },
  });

  const providerMarket = await prisma.works_provider_markets.upsert({
    where: {
      provider_id_market_id: {
        provider_id: provider.id,
        market_id: market.id,
      },
    },
    update: {
      administrative_area: definition.administrativeArea,
      locality: definition.locality,
      serves_nationally: definition.servesNationally,
      accepts_remote_clients: definition.acceptsRemoteClients,
      exports: definition.exports,
      export_regions: definition.exportRegions ?? [],
      active: true,
    },
    create: {
      provider_id: provider.id,
      market_id: market.id,
      administrative_area: definition.administrativeArea,
      locality: definition.locality,
      serves_nationally: definition.servesNationally,
      accepts_remote_clients: definition.acceptsRemoteClients,
      exports: definition.exports,
      export_regions: definition.exportRegions ?? [],
      active: true,
    },
    select: { id: true },
  });

  const providerTypes = await prisma.works_provider_types.findMany({
    where: { key: { in: definition.types } },
    select: { id: true, key: true },
  });
  const providerTypeByKey = new Map(providerTypes.map((row) => [row.key, row.id]));

  for (const typeKey of definition.types) {
    const providerTypeId = providerTypeByKey.get(typeKey);
    if (!providerTypeId) throw new Error(`Missing WORKS provider type ${typeKey}.`);

    await prisma.works_provider_type_links.upsert({
      where: {
        provider_id_provider_type_id: {
          provider_id: provider.id,
          provider_type_id: providerTypeId,
        },
      },
      update: {},
      create: { provider_id: provider.id, provider_type_id: providerTypeId },
    });
  }

  for (const location of definition.locations ?? []) {
    await prisma.works_provider_locations.upsert({
      where: {
        provider_market_id_key: {
          provider_market_id: providerMarket.id,
          key: location.key,
        },
      },
      update: {
        label: location.label,
        location_type: location.locationType,
        address_line_1: location.addressLine1,
        address_line_2: location.addressLine2,
        administrative_area: location.administrativeArea,
        locality: location.locality,
        postal_code: location.postalCode,
        is_primary: location.isPrimary ?? false,
        active: true,
      },
      create: {
        provider_market_id: providerMarket.id,
        key: location.key,
        label: location.label,
        location_type: location.locationType,
        address_line_1: location.addressLine1,
        address_line_2: location.addressLine2,
        administrative_area: location.administrativeArea,
        locality: location.locality,
        postal_code: location.postalCode,
        is_primary: location.isPrimary ?? false,
        active: true,
      },
    });
  }

  const sourceIdByKey = new Map<string, string>();
  for (const source of definition.sources) {
    const existing = await prisma.works_provider_sources.findFirst({
      where: { provider_id: provider.id, url: source.url },
      select: { id: true },
    });

    const record = existing
      ? await prisma.works_provider_sources.update({
          where: { id: existing.id },
          data: {
            name: source.name,
            source_type: WorksProviderSourceType.PROVIDER_WEBSITE,
            checked_at: RESEARCH_DATE,
            active: true,
          },
          select: { id: true },
        })
      : await prisma.works_provider_sources.create({
          data: {
            provider_id: provider.id,
            source_type: WorksProviderSourceType.PROVIDER_WEBSITE,
            name: source.name,
            url: source.url,
            discovered_at: RESEARCH_DATE,
            checked_at: RESEARCH_DATE,
            active: true,
          },
          select: { id: true },
        });

    sourceIdByKey.set(source.key, record.id);
  }

  const categoryRows = await prisma.works_categories.findMany({
    select: { id: true, key: true },
  });
  const serviceRows = await prisma.works_services.findMany({
    select: { id: true, key: true },
  });
  const capabilityRows = await prisma.works_capabilities.findMany({
    select: { id: true, key: true },
  });
  const packagingRows = await prisma.works_packaging_formats.findMany({
    select: { id: true, key: true },
  });

  const categoryByKey = new Map(categoryRows.map((row) => [row.key, row.id]));
  const serviceByKey = new Map(serviceRows.map((row) => [row.key, row.id]));
  const capabilityByKey = new Map(capabilityRows.map((row) => [row.key, row.id]));
  const packagingByKey = new Map(packagingRows.map((row) => [row.key, row.id]));
  const offeringIdBySlug = new Map<string, string>();

  for (const offering of definition.offerings) {
    const record = await prisma.works_offerings.upsert({
      where: {
        provider_market_id_slug: {
          provider_market_id: providerMarket.id,
          slug: offering.slug,
        },
      },
      update: {
        name: offering.name,
        description: offering.description,
        production_model: offering.productionModel,
        moq_value: offering.moqValue,
        moq_unit: offering.moqUnit,
        max_run_value: offering.maxRunValue,
        max_run_unit: offering.maxRunUnit,
        lead_time_min_days: offering.leadTimeMinDays,
        lead_time_max_days: offering.leadTimeMaxDays,
        lead_time_basis: offering.leadTimeBasis,
        sample_available: offering.sampleAvailable,
        startup_friendly: offering.startupFriendly,
        quote_required: offering.quoteRequired ?? true,
        packaging_supplied: offering.packagingSupplied,
        client_packaging_accepted: offering.clientPackagingAccepted,
        active: true,
      },
      create: {
        provider_market_id: providerMarket.id,
        name: offering.name,
        slug: offering.slug,
        description: offering.description,
        production_model: offering.productionModel,
        moq_value: offering.moqValue,
        moq_unit: offering.moqUnit,
        max_run_value: offering.maxRunValue,
        max_run_unit: offering.maxRunUnit,
        lead_time_min_days: offering.leadTimeMinDays,
        lead_time_max_days: offering.leadTimeMaxDays,
        lead_time_basis: offering.leadTimeBasis,
        sample_available: offering.sampleAvailable,
        startup_friendly: offering.startupFriendly,
        quote_required: offering.quoteRequired ?? true,
        packaging_supplied: offering.packagingSupplied,
        client_packaging_accepted: offering.clientPackagingAccepted,
        active: true,
      },
      select: { id: true },
    });

    offeringIdBySlug.set(offering.slug, record.id);

    for (const key of offering.categories) {
      const categoryId = categoryByKey.get(key);
      if (!categoryId) throw new Error(`Missing WORKS category ${key}.`);
      await prisma.works_offering_categories.upsert({
        where: { offering_id_category_id: { offering_id: record.id, category_id: categoryId } },
        update: {},
        create: { offering_id: record.id, category_id: categoryId },
      });
    }

    for (const key of offering.services ?? []) {
      const serviceId = serviceByKey.get(key);
      if (!serviceId) throw new Error(`Missing WORKS service ${key}.`);
      await prisma.works_offering_services.upsert({
        where: { offering_id_service_id: { offering_id: record.id, service_id: serviceId } },
        update: {},
        create: { offering_id: record.id, service_id: serviceId },
      });
    }

    for (const key of offering.capabilities ?? []) {
      const capabilityId = capabilityByKey.get(key);
      if (!capabilityId) throw new Error(`Missing WORKS capability ${key}.`);
      await prisma.works_offering_capabilities.upsert({
        where: { offering_id_capability_id: { offering_id: record.id, capability_id: capabilityId } },
        update: {},
        create: { offering_id: record.id, capability_id: capabilityId },
      });
    }

    for (const key of offering.packagingFormats ?? []) {
      const packagingFormatId = packagingByKey.get(key);
      if (!packagingFormatId) throw new Error(`Missing WORKS packaging format ${key}.`);
      await prisma.works_offering_packaging_formats.upsert({
        where: {
          offering_id_packaging_format_id: {
            offering_id: record.id,
            packaging_format_id: packagingFormatId,
          },
        },
        update: {},
        create: { offering_id: record.id, packaging_format_id: packagingFormatId },
      });
    }
  }

  for (const claim of definition.claims ?? []) {
    await seedClaim(provider.id, offeringIdBySlug, sourceIdByKey, claim);
  }
}
