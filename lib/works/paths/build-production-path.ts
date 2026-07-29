import type { WorksExistingAsset, WorksProductStage } from "@/lib/works/briefs/constants";

export type PathRequirementInput = {
  requirementType: string;
  field: string;
  priority: "REQUIRED" | "PREFERRED" | "OPTIONAL";
};

export type BuildProductionPathInput = {
  stage?: WorksProductStage;
  existingAssets?: WorksExistingAsset[];
  requestedServiceKeys?: string[];
  requirements?: PathRequirementInput[];
};

export type ProductionPathStepDefinition = {
  stepKey: string;
  serviceKey: string;
  title: string;
  status: "COMPLETE" | "NEEDED" | "UNSURE" | "NOT_APPLICABLE";
  dependencyKeys: string[];
  notes?: string;
};

const SERVICE_TITLES: Record<string, string> = {
  FORMULATION: "Formula or recipe",
  PROTOTYPING: "Prototype or sample",
  TESTING: "Testing and analysis",
  REGULATORY_SUPPORT: "Compliance and certification",
  RAW_MATERIAL_SOURCING: "Ingredients and raw materials",
  MANUFACTURING: "Manufacturing",
  PACKAGING: "Packaging and filling",
  LABELLING: "Label application",
  PRINTING: "Labels and printed packaging",
  WAREHOUSING: "Warehousing",
  FULFILMENT: "Fulfilment",
  LOGISTICS: "Logistics",
  EXPORT_PREPARATION: "Export preparation",
};

export function buildProductionPath(
  input: BuildProductionPathInput
): ProductionPathStepDefinition[] {
  const assets = new Set(input.existingAssets ?? []);
  const requested = new Set(input.requestedServiceKeys ?? []);
  const requirements = input.requirements ?? [];
  const steps: ProductionPathStepDefinition[] = [];

  const hasComplianceRequirement = requirements.some(
    (requirement) =>
      requirement.priority === "REQUIRED" &&
      ["COMPLIANCE", "CERTIFICATION", "CREDENTIAL", "REGULATORY"].includes(
        requirement.requirementType
      )
  );

  function addStep(
    serviceKey: string,
    status: ProductionPathStepDefinition["status"],
    options?: { notes?: string; dependencyKeys?: string[]; title?: string }
  ) {
    if (steps.some((step) => step.serviceKey === serviceKey)) return;

    steps.push({
      stepKey: serviceKey,
      serviceKey,
      title: options?.title ?? SERVICE_TITLES[serviceKey] ?? serviceKey,
      status,
      dependencyKeys: options?.dependencyKeys ?? [],
      notes: options?.notes,
    });
  }

  addStep(
    "FORMULATION",
    assets.has("FORMULA")
      ? "COMPLETE"
      : input.stage === "IDEA" || requested.has("FORMULATION")
        ? "NEEDED"
        : "UNSURE"
  );

  if (
    input.stage === "IDEA" ||
    assets.has("PROTOTYPE") ||
    requested.has("PROTOTYPING")
  ) {
    addStep(
      "PROTOTYPING",
      assets.has("PROTOTYPE") ? "COMPLETE" : "NEEDED",
      { dependencyKeys: ["FORMULATION"] }
    );
  }

  addStep(
    "TESTING",
    assets.has("TESTING")
      ? "COMPLETE"
      : requested.has("TESTING")
        ? "NEEDED"
        : "UNSURE",
    { dependencyKeys: ["FORMULATION"] }
  );

  if (
    hasComplianceRequirement ||
    assets.has("REGULATORY") ||
    assets.has("CERTIFICATIONS") ||
    requested.has("REGULATORY_SUPPORT")
  ) {
    addStep(
      "REGULATORY_SUPPORT",
      assets.has("REGULATORY") || assets.has("CERTIFICATIONS")
        ? "COMPLETE"
        : "NEEDED",
      {
        dependencyKeys: ["FORMULATION"],
        notes: hasComplianceRequirement
          ? "A required compliance or certification condition exists on this brief."
          : undefined,
      }
    );
  }

  if (assets.has("INGREDIENTS") || requested.has("RAW_MATERIAL_SOURCING")) {
    addStep(
      "RAW_MATERIAL_SOURCING",
      assets.has("INGREDIENTS") ? "COMPLETE" : "NEEDED",
      { dependencyKeys: ["FORMULATION"] }
    );
  }

  const manufacturingStatus =
    input.stage === "CURRENT_MANUFACTURER" && !requested.has("MANUFACTURING")
      ? "COMPLETE"
      : requested.has("MANUFACTURING") || input.stage !== "CURRENT_MANUFACTURER"
        ? "NEEDED"
        : "UNSURE";

  addStep("MANUFACTURING", manufacturingStatus, {
    dependencyKeys: ["FORMULATION"],
  });

  addStep(
    "PACKAGING",
    assets.has("PACKAGING")
      ? "COMPLETE"
      : requested.has("PACKAGING")
        ? "NEEDED"
        : "UNSURE",
    { dependencyKeys: ["MANUFACTURING"] }
  );

  for (const serviceKey of [
    "LABELLING",
    "PRINTING",
    "WAREHOUSING",
    "FULFILMENT",
    "LOGISTICS",
    "EXPORT_PREPARATION",
  ]) {
    if (!requested.has(serviceKey)) continue;

    addStep(serviceKey, "NEEDED", {
      dependencyKeys:
        serviceKey === "PRINTING" || serviceKey === "LABELLING"
          ? ["PACKAGING"]
          : ["MANUFACTURING"],
    });
  }

  return steps.map((step, index) => ({ ...step, stepKey: step.stepKey || `STEP_${index + 1}` }));
}
