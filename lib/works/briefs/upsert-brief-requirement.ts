import { Prisma, WorksRequirementPriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type UpsertBriefRequirementInput = {
  briefId: string;
  requirementType: string;
  field: string;
  value: Prisma.InputJsonValue;
  displayValue?: string | null;
  priority?: WorksRequirementPriority;
  appliesToServiceKey?: string | null;
};

export async function upsertBriefRequirement(input: UpsertBriefRequirementInput) {
  const brief = await prisma.works_product_briefs.findUnique({
    where: { id: input.briefId },
    select: { id: true },
  });

  if (!brief) throw new Error(`WORKS brief ${input.briefId} was not found.`);

  const service = input.appliesToServiceKey
    ? await prisma.works_services.findFirst({
        where: { key: input.appliesToServiceKey, active: true },
        select: { id: true },
      })
    : null;

  if (input.appliesToServiceKey && !service) {
    throw new Error(
      `WORKS service ${input.appliesToServiceKey} was not found while saving ${input.field}.`
    );
  }

  const current = await prisma.works_requirements.findFirst({
    where: {
      brief_id: input.briefId,
      field: input.field,
    },
    orderBy: { updated_at: "desc" },
  });

  if (current) {
    return prisma.works_requirements.update({
      where: { id: current.id },
      data: {
        applies_to_service_id: service?.id ?? null,
        requirement_type: input.requirementType,
        value: input.value,
        display_value: input.displayValue,
        priority: input.priority ?? current.priority,
      },
    });
  }

  return prisma.works_requirements.create({
    data: {
      brief_id: input.briefId,
      applies_to_service_id: service?.id ?? null,
      requirement_type: input.requirementType,
      field: input.field,
      value: input.value,
      display_value: input.displayValue,
      priority: input.priority ?? WorksRequirementPriority.REQUIRED,
    },
  });
}
