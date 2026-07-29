import { prisma } from "@/lib/prisma";

export async function buildProviderBrief(briefId: string, providerId: string, routeOptionId?: string | null) {
  const route = await prisma.works_route_options.findFirst({
    where: {
      brief_id: briefId,
      ...(routeOptionId ? { id: routeOptionId } : { is_current: true, rank: 1 }),
    },
    include: {
      brief: {
        include: {
          category: { select: { key: true } },
          requirements: {
            include: { applies_to_service: { select: { key: true } } },
            orderBy: { created_at: "asc" },
          },
        },
      },
      assignments: {
        where: {
          offering: { provider_market: { provider_id: providerId } },
        },
        orderBy: { position: "asc" },
        include: {
          step: { include: { service: { select: { key: true } } } },
          offering: { select: { name: true } },
        },
      },
    },
  });

  if (!route) throw new Error("The current WORKS route was not found.");
  if (route.assignments.length === 0) throw new Error("This provider is not assigned to the selected route.");

  const serviceKeys = new Set(
    route.assignments
      .map((assignment) => assignment.step.service?.key)
      .filter((key): key is string => Boolean(key))
  );

  const requirements = route.brief.requirements
    .filter((requirement) => {
      const scoped = requirement.applies_to_service?.key;
      return !scoped || serviceKeys.has(scoped);
    })
    .map((requirement) => ({
      field: requirement.field,
      value: requirement.value,
      displayValue: requirement.display_value,
      priority: requirement.priority,
      serviceKey: requirement.applies_to_service?.key ?? null,
    }));

  return {
    routeOptionId: route.id,
    product: route.brief.product_description,
    productType: route.brief.product_type,
    category: route.brief.category?.key ?? null,
    stage: route.brief.stage,
    quantity: {
      target: route.brief.target_quantity == null ? null : Number(route.brief.target_quantity),
      unit: route.brief.quantity_unit,
    },
    location: {
      preference: route.brief.location_preference,
      area: route.brief.administrative_area,
    },
    existingAssets: route.brief.existing_assets,
    requestedServices: route.brief.requested_services,
    relevantSteps: route.assignments.map((assignment) => assignment.step.title),
    offerings: route.assignments
      .map((assignment) => assignment.offering?.name)
      .filter((name): name is string => Boolean(name)),
    requirements,
  };
}
