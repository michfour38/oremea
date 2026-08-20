import { auth } from "@clerk/nextjs/server";
import { Prisma, WorksOfferingEvidenceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const PRODUCTION_MODELS = new Set([
  "CUSTOM_MANUFACTURING",
  "CUSTOM_FORMULATION",
  "PRIVATE_LABEL",
  "WHITE_LABEL",
  "CO_PACKING",
  "SERVICE_ONLY",
  "SUPPLY_ONLY",
]);

const QUANTITY_UNITS = new Set([
  "UNITS",
  "MG",
  "G",
  "KG",
  "ML",
  "LITRES",
  "OZ",
  "LB",
  "FL_OZ_US",
  "GALLON_US",
  "FL_OZ_IMPERIAL",
  "GALLON_IMPERIAL",
]);

const LEAD_TIME_BASES = new Set(["WORKING_DAYS", "CALENDAR_DAYS"]);

const offeringInclude = {
  categories: { include: { category: { select: { key: true } } } },
  services: { include: { service: { select: { key: true } } } },
  capabilities: { include: { capability: { select: { key: true } } } },
  packaging_formats: {
    include: { packaging_format: { select: { key: true } } },
  },
} satisfies Prisma.works_offeringsInclude;

type OfferingRecord = Prisma.works_offeringsGetPayload<{
  include: typeof offeringInclude;
}>;

class OfferingInputError extends Error {}

function cleanText(value: unknown, maximum: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (cleaned.length > maximum) {
    throw new OfferingInputError(`Keep this field below ${maximum} characters.`);
  }
  return cleaned;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
}

function optionalNumber(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new OfferingInputError(`${label} must be zero or more.`);
  }
  return parsed;
}

function optionalInteger(value: unknown, label: string) {
  const parsed = optionalNumber(value, label);
  if (parsed === null) return null;
  if (!Number.isInteger(parsed)) {
    throw new OfferingInputError(`${label} must be a whole number of days.`);
  }
  return parsed;
}

function optionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function selectValue(value: unknown, allowed: Set<string>, label: string) {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().toUpperCase();
  if (!allowed.has(normalized)) {
    throw new OfferingInputError(`Choose a valid ${label}.`);
  }
  return normalized;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "offering";
}

function labelFor(key: string, translation?: { name: string; description: string | null }) {
  return {
    key,
    name: translation?.name ?? key.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, (char) => char.toUpperCase()),
    description: translation?.description ?? null,
  };
}

function serializeOffering(offering: OfferingRecord) {
  return {
    id: offering.id,
    name: offering.name,
    slug: offering.slug,
    description: offering.description,
    productionModel: offering.production_model,
    moqValue: offering.moq_value == null ? null : Number(offering.moq_value),
    moqUnit: offering.moq_unit,
    maxRunValue: offering.max_run_value == null ? null : Number(offering.max_run_value),
    maxRunUnit: offering.max_run_unit,
    leadTimeMinDays: offering.lead_time_min_days,
    leadTimeMaxDays: offering.lead_time_max_days,
    leadTimeBasis: offering.lead_time_basis,
    sampleAvailable: offering.sample_available,
    startupFriendly: offering.startup_friendly,
    quoteRequired: offering.quote_required,
    packagingSupplied: offering.packaging_supplied,
    clientPackagingAccepted: offering.client_packaging_accepted,
    evidenceStatus: offering.evidence_status,
    active: offering.active,
    categoryKeys: offering.categories.map((row) => row.category.key),
    serviceKeys: offering.services.map((row) => row.service.key),
    capabilityKeys: offering.capabilities.map((row) => row.capability.key),
    packagingFormatKeys: offering.packaging_formats.map((row) => row.packaging_format.key),
  };
}

function parseOfferingBody(body: Record<string, unknown>) {
  const name = cleanText(body.name, 120);
  if (!name || name.length < 2) {
    throw new OfferingInputError("Add a clear name for this offering.");
  }

  const categoryKeys = stringArray(body.categoryKeys);
  const serviceKeys = stringArray(body.serviceKeys);
  const capabilityKeys = stringArray(body.capabilityKeys);
  const packagingFormatKeys = stringArray(body.packagingFormatKeys);
  const active = body.active === true;

  if (active && categoryKeys.length === 0) {
    throw new OfferingInputError("Choose at least one product category before including this offering in matching.");
  }
  if (active && serviceKeys.length === 0) {
    throw new OfferingInputError("Choose at least one production service before including this offering in matching.");
  }
  if (categoryKeys.length === 0 && (serviceKeys.length || capabilityKeys.length || packagingFormatKeys.length)) {
    throw new OfferingInputError("Choose the product category before adding services, capabilities or packaging formats.");
  }

  const moqValue = optionalNumber(body.moqValue, "Minimum order quantity");
  const maxRunValue = optionalNumber(body.maxRunValue, "Maximum run quantity");
  const selectedQuantityUnit = selectValue(body.quantityUnit, QUANTITY_UNITS, "quantity unit");
  if ((moqValue !== null || maxRunValue !== null) && !selectedQuantityUnit) {
    throw new OfferingInputError("Choose the unit used for minimum and maximum quantities.");
  }
  if (moqValue !== null && maxRunValue !== null && moqValue > maxRunValue) {
    throw new OfferingInputError("The maximum run must be at least as large as the minimum order.");
  }

  const leadTimeMinDays = optionalInteger(body.leadTimeMinDays, "Minimum lead time");
  const leadTimeMaxDays = optionalInteger(body.leadTimeMaxDays, "Maximum lead time");
  if (leadTimeMinDays !== null && leadTimeMaxDays !== null && leadTimeMinDays > leadTimeMaxDays) {
    throw new OfferingInputError("The maximum lead time must be at least as long as the minimum lead time.");
  }
  const selectedLeadTimeBasis = selectValue(body.leadTimeBasis, LEAD_TIME_BASES, "lead-time basis");
  if ((leadTimeMinDays !== null || leadTimeMaxDays !== null) && !selectedLeadTimeBasis) {
    throw new OfferingInputError("Choose whether the lead time uses working days or calendar days.");
  }

  return {
    name,
    description: cleanText(body.description, 2_000),
    productionModel: selectValue(body.productionModel, PRODUCTION_MODELS, "production model"),
    moqValue,
    maxRunValue,
    quantityUnit: moqValue !== null || maxRunValue !== null ? selectedQuantityUnit : null,
    leadTimeMinDays,
    leadTimeMaxDays,
    leadTimeBasis: leadTimeMinDays !== null || leadTimeMaxDays !== null ? selectedLeadTimeBasis : null,
    sampleAvailable: optionalBoolean(body.sampleAvailable),
    startupFriendly: optionalBoolean(body.startupFriendly),
    packagingSupplied: optionalBoolean(body.packagingSupplied),
    clientPackagingAccepted: optionalBoolean(body.clientPackagingAccepted),
    quoteRequired: body.quoteRequired !== false,
    active,
    categoryKeys,
    serviceKeys,
    capabilityKeys,
    packagingFormatKeys,
  };
}

async function assertOwnership(userId: string, providerId: string, providerMarketId: string) {
  const membership = await prisma.works_provider_memberships.findFirst({
    where: {
      provider_id: providerId,
      clerk_user_id: userId,
      active: true,
      provider: {
        markets: { some: { id: providerMarketId, active: true } },
      },
    },
    select: { id: true },
  });

  if (!membership) {
    throw new OfferingInputError("This provider market is not available to your account.");
  }
}

async function resolveCatalogIds(
  providerMarketId: string,
  input: ReturnType<typeof parseOfferingBody>,
) {
  const providerMarket = await prisma.works_provider_markets.findUnique({
    where: { id: providerMarketId },
    select: { market_id: true },
  });
  if (!providerMarket) throw new OfferingInputError("This WORKS market is no longer available.");

  const [categories, services, capabilities, packagingFormats] = await Promise.all([
    prisma.works_market_categories.findMany({
      where: {
        market_id: providerMarket.market_id,
        enabled: true,
        category: { active: true, key: { in: input.categoryKeys } },
      },
      select: { category: { select: { id: true, key: true } } },
    }),
    prisma.works_services.findMany({
      where: {
        active: true,
        key: { in: input.serviceKeys },
        ...(input.categoryKeys.length
          ? { categories: { some: { category: { key: { in: input.categoryKeys } } } } }
          : {}),
      },
      select: { id: true, key: true },
    }),
    prisma.works_capabilities.findMany({
      where: {
        active: true,
        key: { in: input.capabilityKeys },
        ...(input.categoryKeys.length
          ? { categories: { some: { category: { key: { in: input.categoryKeys } } } } }
          : {}),
      },
      select: { id: true, key: true },
    }),
    prisma.works_packaging_formats.findMany({
      where: {
        active: true,
        key: { in: input.packagingFormatKeys },
        ...(input.categoryKeys.length
          ? { categories: { some: { category: { key: { in: input.categoryKeys } } } } }
          : {}),
      },
      select: { id: true, key: true },
    }),
  ]);

  const categoryRows = categories.map((row) => row.category);
  const checks: Array<[string, string[], Array<{ key: string }>]> = [
    ["category", input.categoryKeys, categoryRows],
    ["service", input.serviceKeys, services],
    ["capability", input.capabilityKeys, capabilities],
    ["packaging format", input.packagingFormatKeys, packagingFormats],
  ];
  for (const [label, requested, found] of checks) {
    if (new Set(found.map((row) => row.key)).size !== requested.length) {
      throw new OfferingInputError(`One or more selected ${label} values are not available for this market and category.`);
    }
  }

  return { categoryRows, services, capabilities, packagingFormats };
}

async function uniqueOfferingSlug(providerMarketId: string, name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (
    await prisma.works_offerings.findUnique({
      where: { provider_market_id_slug: { provider_market_id: providerMarketId, slug } },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to manage provider capabilities." }, { status: 401 });
  }

  const [memberships, categories, services, capabilities, packagingFormats] = await Promise.all([
    prisma.works_provider_memberships.findMany({
      where: { clerk_user_id: userId, active: true },
      orderBy: { created_at: "asc" },
      select: {
        role: true,
        provider: {
          select: {
            id: true,
            name: true,
            slug: true,
            profile_status: true,
            commercial_profile: { select: { plan: true } },
            markets: {
              where: { active: true },
              orderBy: { created_at: "asc" },
              select: {
                id: true,
                market_id: true,
                market: { select: { name: true, code: true, currency_code: true } },
                offerings: { include: offeringInclude, orderBy: { name: "asc" } },
              },
            },
          },
        },
      },
    }),
    prisma.works_categories.findMany({
      where: { active: true, markets: { some: { enabled: true, market: { active: true } } } },
      orderBy: { key: "asc" },
      select: {
        key: true,
        translations: {
          where: { locale: { code: "en-ZA" } },
          select: { name: true, description: true },
          take: 1,
        },
        markets: { where: { enabled: true, market: { active: true } }, select: { market_id: true } },
      },
    }),
    prisma.works_services.findMany({
      where: { active: true },
      orderBy: { sort_order: "asc" },
      select: {
        key: true,
        translations: { where: { locale: { code: "en-ZA" } }, select: { name: true, description: true }, take: 1 },
        categories: { select: { category: { select: { key: true } } } },
      },
    }),
    prisma.works_capabilities.findMany({
      where: { active: true },
      orderBy: { sort_order: "asc" },
      select: {
        key: true,
        translations: { where: { locale: { code: "en-ZA" } }, select: { name: true, description: true }, take: 1 },
        categories: { select: { category: { select: { key: true } } } },
      },
    }),
    prisma.works_packaging_formats.findMany({
      where: { active: true },
      orderBy: { sort_order: "asc" },
      select: {
        key: true,
        translations: { where: { locale: { code: "en-ZA" } }, select: { name: true, description: true }, take: 1 },
        categories: { select: { category: { select: { key: true } } } },
      },
    }),
  ]);

  return NextResponse.json({
    providers: memberships.map((membership) => ({
      id: membership.provider.id,
      name: membership.provider.name,
      slug: membership.provider.slug,
      role: membership.role,
      profileStatus: membership.provider.profile_status,
      plan: membership.provider.commercial_profile?.plan ?? "FREE",
      markets: membership.provider.markets.map((market) => ({
        id: market.id,
        marketId: market.market_id,
        name: market.market.name,
        code: market.market.code,
        currencyCode: market.market.currency_code,
        offerings: market.offerings.map(serializeOffering),
      })),
    })),
    catalog: {
      categories: categories.map((row) => ({
        ...labelFor(row.key, row.translations[0]),
        marketIds: row.markets.map((market) => market.market_id),
      })),
      services: services.map((row) => ({
        ...labelFor(row.key, row.translations[0]),
        categoryKeys: row.categories.map((item) => item.category.key),
      })),
      capabilities: capabilities.map((row) => ({
        ...labelFor(row.key, row.translations[0]),
        categoryKeys: row.categories.map((item) => item.category.key),
      })),
      packagingFormats: packagingFormats.map((row) => ({
        ...labelFor(row.key, row.translations[0]),
        categoryKeys: row.categories.map((item) => item.category.key),
      })),
    },
  });
}

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to add a provider offering." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  const providerMarketId = typeof body?.providerMarketId === "string" ? body.providerMarketId : "";
  if (!providerId || !providerMarketId || !body) {
    return NextResponse.json({ error: "Choose the provider business and market for this offering." }, { status: 400 });
  }

  try {
    await assertOwnership(userId, providerId, providerMarketId);
    const input = parseOfferingBody(body);
    const catalog = await resolveCatalogIds(providerMarketId, input);
    const slug = await uniqueOfferingSlug(providerMarketId, input.name);

    const offering = await prisma.works_offerings.create({
      data: {
        provider_market_id: providerMarketId,
        name: input.name,
        slug,
        description: input.description,
        production_model: input.productionModel,
        moq_value: input.moqValue,
        moq_unit: input.quantityUnit,
        max_run_value: input.maxRunValue,
        max_run_unit: input.quantityUnit,
        lead_time_min_days: input.leadTimeMinDays,
        lead_time_max_days: input.leadTimeMaxDays,
        lead_time_basis: input.leadTimeBasis,
        sample_available: input.sampleAvailable,
        startup_friendly: input.startupFriendly,
        quote_required: input.quoteRequired,
        packaging_supplied: input.packagingSupplied,
        client_packaging_accepted: input.clientPackagingAccepted,
        evidence_status: WorksOfferingEvidenceStatus.SELF_REPORTED,
        active: input.active,
        categories: { create: catalog.categoryRows.map((row) => ({ category_id: row.id })) },
        services: { create: catalog.services.map((row) => ({ service_id: row.id })) },
        capabilities: { create: catalog.capabilities.map((row) => ({ capability_id: row.id })) },
        packaging_formats: { create: catalog.packagingFormats.map((row) => ({ packaging_format_id: row.id })) },
      },
      include: offeringInclude,
    });

    return NextResponse.json({
      offering: serializeOffering(offering),
      message: input.active
        ? "Offering saved in matching as a possible fit. WORKS will keep its provider-supplied evidence boundary visible until review."
        : "Offering draft saved.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof OfferingInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to update a provider offering." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  const providerMarketId = typeof body?.providerMarketId === "string" ? body.providerMarketId : "";
  const offeringId = typeof body?.offeringId === "string" ? body.offeringId : "";
  if (!providerId || !providerMarketId || !offeringId || !body) {
    return NextResponse.json({ error: "Choose the offering to update." }, { status: 400 });
  }

  try {
    await assertOwnership(userId, providerId, providerMarketId);
    const existing = await prisma.works_offerings.findFirst({
      where: { id: offeringId, provider_market_id: providerMarketId },
      select: { id: true },
    });
    if (!existing) throw new OfferingInputError("This offering is not available to your account.");

    const input = parseOfferingBody(body);
    const catalog = await resolveCatalogIds(providerMarketId, input);
    const offering = await prisma.works_offerings.update({
      where: { id: offeringId },
      data: {
        name: input.name,
        description: input.description,
        production_model: input.productionModel,
        moq_value: input.moqValue,
        moq_unit: input.quantityUnit,
        max_run_value: input.maxRunValue,
        max_run_unit: input.quantityUnit,
        lead_time_min_days: input.leadTimeMinDays,
        lead_time_max_days: input.leadTimeMaxDays,
        lead_time_basis: input.leadTimeBasis,
        sample_available: input.sampleAvailable,
        startup_friendly: input.startupFriendly,
        quote_required: input.quoteRequired,
        packaging_supplied: input.packagingSupplied,
        client_packaging_accepted: input.clientPackagingAccepted,
        evidence_status: WorksOfferingEvidenceStatus.SELF_REPORTED,
        active: input.active,
        categories: { deleteMany: {}, create: catalog.categoryRows.map((row) => ({ category_id: row.id })) },
        services: { deleteMany: {}, create: catalog.services.map((row) => ({ service_id: row.id })) },
        capabilities: { deleteMany: {}, create: catalog.capabilities.map((row) => ({ capability_id: row.id })) },
        packaging_formats: { deleteMany: {}, create: catalog.packagingFormats.map((row) => ({ packaging_format_id: row.id })) },
      },
      include: offeringInclude,
    });

    return NextResponse.json({
      offering: serializeOffering(offering),
      message: input.active
        ? "Offering updated in matching as a possible fit. Because the provider changed it, WORKS will review the new information before treating it as confirmed."
        : "Offering draft saved and removed from current matching.",
    });
  } catch (error) {
    if (error instanceof OfferingInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
