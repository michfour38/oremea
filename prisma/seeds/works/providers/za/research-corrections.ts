import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ServiceCorrection = {
  providerSlug: string;
  offeringSlug: string;
  removeServiceKey: string;
  addServiceKey: string;
};

const SERVICE_CORRECTIONS: ServiceCorrection[] = [
  {
    providerSlug: "bonpak",
    offeringSlug: "glass-plastic-packaging",
    removeServiceKey: "PACKAGING",
    addServiceKey: "PACKAGING_SUPPLY",
  },
  {
    providerSlug: "gateway-print-packaging",
    offeringSlug: "custom-folding-cartons",
    removeServiceKey: "PACKAGING",
    addServiceKey: "PACKAGING_SUPPLY",
  },
];

export async function applyWorksZaResearchCorrections() {
  const services = await prisma.works_services.findMany({
    where: {
      key: {
        in: Array.from(
          new Set(
            SERVICE_CORRECTIONS.flatMap((correction) => [
              correction.removeServiceKey,
              correction.addServiceKey,
            ])
          )
        ),
      },
    },
    select: { id: true, key: true },
  });
  const serviceByKey = new Map(services.map((service) => [service.key, service.id]));

  for (const correction of SERVICE_CORRECTIONS) {
    const offering = await prisma.works_offerings.findFirstOrThrow({
      where: {
        slug: correction.offeringSlug,
        provider_market: {
          provider: { slug: correction.providerSlug },
          market: { code: "ZA" },
        },
      },
      select: { id: true },
    });

    const removeServiceId = serviceByKey.get(correction.removeServiceKey);
    const addServiceId = serviceByKey.get(correction.addServiceKey);
    if (!removeServiceId || !addServiceId) {
      throw new Error(
        `Missing WORKS service while applying ZA research correction ${correction.providerSlug}/${correction.offeringSlug}.`
      );
    }

    await prisma.works_offering_services.deleteMany({
      where: {
        offering_id: offering.id,
        service_id: removeServiceId,
      },
    });

    await prisma.works_offering_services.upsert({
      where: {
        offering_id_service_id: {
          offering_id: offering.id,
          service_id: addServiceId,
        },
      },
      update: {},
      create: {
        offering_id: offering.id,
        service_id: addServiceId,
      },
    });
  }
}
