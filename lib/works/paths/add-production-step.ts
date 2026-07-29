import {
  WorksProductionStepSource,
  WorksProductionStepStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AddProductionStepInput = {
  briefId: string;
  title: string;
  serviceKey?: string;
  notes?: string;
  dependencyKeys?: string[];
};

export async function addProductionStep(input: AddProductionStepInput) {
  const title = input.title.trim();
  if (!title) throw new Error("A production-step title is required.");

  const path = await prisma.works_production_paths.findFirst({
    where: { brief_id: input.briefId, is_current: true },
    orderBy: { version: "desc" },
    select: { id: true },
  });

  if (!path) {
    throw new Error("No current WORKS production path exists for this brief.");
  }

  const service = input.serviceKey
    ? await prisma.works_services.findUnique({
        where: { key: input.serviceKey },
        select: { id: true },
      })
    : null;

  if (input.serviceKey && !service) {
    throw new Error(`Unknown WORKS service ${input.serviceKey}.`);
  }

  const lastStep = await prisma.works_production_steps.findFirst({
    where: { path_id: path.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return prisma.works_production_steps.create({
    data: {
      path_id: path.id,
      service_id: service?.id,
      step_key: null,
      title,
      position: (lastStep?.position ?? 0) + 1,
      status: WorksProductionStepStatus.NEEDED,
      source: WorksProductionStepSource.USER_ADDED,
      dependency_keys: input.dependencyKeys ?? [],
      notes: input.notes,
    },
  });
}
