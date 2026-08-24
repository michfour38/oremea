export type WorksMatchStatusValue = "MATCH" | "NO_MATCH" | "UNKNOWN";

export type MatchBriefRequirement = {
  id: string;
  requirementType: string;
  field: string;
  value: unknown;
  priority: "REQUIRED" | "PREFERRED" | "OPTIONAL";
  appliesToServiceKey?: string | null;
};

export type MatchPathStep = {
  id: string;
  serviceKey?: string | null;
  title: string;
  status: "COMPLETE" | "NEEDED" | "UNSURE" | "NOT_APPLICABLE";
};

export type MatchClaim = {
  id: string;
  field: string;
  value: unknown;
  status:
    | "UNKNOWN"
    | "SELF_REPORTED"
    | "EVIDENCE_SUPPLIED"
    | "SOURCE_CONFIRMED"
    | "AUTHORITY_VERIFIED"
    | "STALE"
    | "CONFLICTING"
    | "EXPIRED";
  credentialName?: string | null;
  designation?: string | null;
  scope?: string | null;
};

export type MatchBrief = {
  categoryKey?: string | null;
  targetQuantity?: number | null;
  minimumQuantity?: number | null;
  preferredQuantity?: number | null;
  maximumQuantity?: number | null;
  quantityUnit?: string | null;
  locationPreference?: string | null;
  administrativeArea?: string | null;
  requirements: MatchBriefRequirement[];
  steps: MatchPathStep[];
};

export type MatchOffering = {
  evidenceStatus?: "SELF_REPORTED" | "SOURCE_REVIEWED" | "VERIFIED";
  evidenceAgeDays?: number | null;
  categoryKeys: string[];
  serviceKeys: string[];
  capabilityKeys: string[];
  packagingFormatKeys: string[];
  moqValue?: number | null;
  moqUnit?: string | null;
  maxRunValue?: number | null;
  maxRunUnit?: string | null;
  providerAdministrativeArea?: string | null;
  providerLocationAreas: string[];
  claims: MatchClaim[];
};

export type MatchOutcomeDraft = {
  requirementId?: string;
  stepId?: string;
  sourceClaimId?: string;
  criterionType: string;
  criterionKey: string;
  status: WorksMatchStatusValue;
  priority?: MatchBriefRequirement["priority"];
  hardConstraint: boolean;
  scoreDelta: number;
  expectedValue?: unknown;
  actualValue?: unknown;
  explanation: string;
};

export type OfferingFitResult = {
  status: WorksMatchStatusValue;
  fitScore: number;
  coveredStepCount: number;
  matchedCount: number;
  unknownCount: number;
  failedCount: number;
  outcomes: MatchOutcomeDraft[];
};

export const WORKS_EVIDENCE_FRESHNESS_DAYS = 180;

const QUANTITY_BEARING_SERVICES = new Set([
  "MANUFACTURING",
  "PACKAGING",
  "PRINTING",
  "LABELLING",
  "RAW_MATERIAL_SOURCING",
]);

const POSITIVE_CLAIM_STATUSES = new Set([
  "EVIDENCE_SUPPLIED",
  "SOURCE_CONFIRMED",
  "AUTHORITY_VERIFIED",
]);
const REGULATED_CLAIM_STATUSES = new Set([
  "SOURCE_CONFIRMED",
  "AUTHORITY_VERIFIED",
]);

const NON_CURRENT_CLAIM_STATUSES = new Set(["STALE", "CONFLICTING", "EXPIRED"]);

function regulatedRequirement(requirement: MatchBriefRequirement) {
  return (
    requirement.requirementType === "CREDENTIAL" ||
    requirement.field.startsWith("credential.") ||
    requirement.field.startsWith("licence.") ||
    requirement.field.startsWith("license.") ||
    requirement.field.startsWith("compliance.") ||
    requirement.field.startsWith("certification.")
  );
}

function normalise(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function claimSaysNo(value: unknown): boolean {
  if (value === false) return true;
  if (typeof value === "string") {
    return ["NO", "FALSE", "NOT_AVAILABLE", "NOT_SUPPORTED"].includes(normalise(value));
  }
  return false;
}

function claimMatchesExpected(claim: MatchClaim, expected: unknown): boolean {
  const expectedKey = normalise(expected);
  if (!expectedKey) return false;

  if (typeof claim.value === "string" && normalise(claim.value) === expectedKey) return true;
  if (claim.value === true) return true;

  return [claim.credentialName, claim.designation, claim.scope]
    .filter(Boolean)
    .some((value) => normalise(value).includes(expectedKey));
}

function evaluateRequirement(
  requirement: MatchBriefRequirement,
  offering: MatchOffering
): MatchOutcomeDraft | null {
  if (
    requirement.field.startsWith("commercial.quantity.") ||
    requirement.requirementType === "TAXONOMY_INPUT"
  ) {
    return null;
  }

  if (
    requirement.appliesToServiceKey &&
    !offering.serviceKeys.includes(requirement.appliesToServiceKey)
  ) {
    return null;
  }

  const hardConstraint = requirement.priority === "REQUIRED";
  const matchScore = hardConstraint ? 16 : requirement.priority === "PREFERRED" ? 6 : 2;
  const missScore = hardConstraint ? -100 : -3;
  const expected = normalise(requirement.value);

  if (requirement.requirementType === "CAPABILITY") {
    if (offering.capabilityKeys.includes(expected)) {
      return {
        requirementId: requirement.id,
        criterionType: "REQUIREMENT",
        criterionKey: requirement.field,
        status: "MATCH",
        priority: requirement.priority,
        hardConstraint,
        scoreDelta: matchScore,
        expectedValue: requirement.value,
        actualValue: expected,
        explanation: `The offering explicitly supports ${expected}.`,
      };
    }

    return {
      requirementId: requirement.id,
      criterionType: "REQUIREMENT",
      criterionKey: requirement.field,
      status: "UNKNOWN",
      priority: requirement.priority,
      hardConstraint,
      scoreDelta: 0,
      expectedValue: requirement.value,
      explanation: `Current evidence does not confirm whether this offering supports ${expected}.`,
    };
  }

  if (requirement.requirementType === "PACKAGING") {
    if (offering.packagingFormatKeys.includes(expected)) {
      return {
        requirementId: requirement.id,
        criterionType: "REQUIREMENT",
        criterionKey: requirement.field,
        status: "MATCH",
        priority: requirement.priority,
        hardConstraint,
        scoreDelta: matchScore,
        expectedValue: requirement.value,
        actualValue: expected,
        explanation: `The offering explicitly supports ${expected.toLowerCase()} packaging.`,
      };
    }

    return {
      requirementId: requirement.id,
      criterionType: "REQUIREMENT",
      criterionKey: requirement.field,
      status: "UNKNOWN",
      priority: requirement.priority,
      hardConstraint,
      scoreDelta: 0,
      expectedValue: requirement.value,
      explanation: `Current evidence does not confirm ${expected.toLowerCase()} packaging for this offering.`,
    };
  }

  const matchingClaims = offering.claims.filter(
    (claim) => claim.field === requirement.field || claimMatchesExpected(claim, requirement.value)
  );

  const explicitNo = matchingClaims.find(
    (claim) =>
      claim.status !== "UNKNOWN" &&
      !NON_CURRENT_CLAIM_STATUSES.has(claim.status) &&
      claimSaysNo(claim.value)
  );
  if (explicitNo) {
    return {
      requirementId: requirement.id,
      sourceClaimId: explicitNo.id,
      criterionType: "REQUIREMENT",
      criterionKey: requirement.field,
      status: "NO_MATCH",
      priority: requirement.priority,
      hardConstraint,
      scoreDelta: missScore,
      expectedValue: requirement.value,
      actualValue: explicitNo.value,
      explanation: `A current provider claim explicitly conflicts with this requirement.`,
    };
  }

  const nonCurrent = matchingClaims.find(
    (claim) =>
      NON_CURRENT_CLAIM_STATUSES.has(claim.status) &&
      claimMatchesExpected(claim, requirement.value)
  );
  if (nonCurrent) {
    const explanation =
      nonCurrent.status === "EXPIRED"
        ? "The evidence previously supporting this requirement has expired and must be renewed before WORKS can treat it as current."
        : nonCurrent.status === "CONFLICTING"
          ? "WORKS has conflicting evidence for this requirement, so it remains unresolved until the conflict is cleared."
          : "The evidence previously supporting this requirement is stale and must be reconfirmed.";
    return {
      requirementId: requirement.id,
      sourceClaimId: nonCurrent.id,
      criterionType: "REQUIREMENT",
      criterionKey: requirement.field,
      status: "UNKNOWN",
      priority: requirement.priority,
      hardConstraint,
      scoreDelta: 0,
      expectedValue: requirement.value,
      actualValue: nonCurrent.value,
      explanation,
    };
  }

  const acceptedStatuses = regulatedRequirement(requirement)
    ? REGULATED_CLAIM_STATUSES
    : POSITIVE_CLAIM_STATUSES;
  const confirmed = matchingClaims.find(
    (claim) => acceptedStatuses.has(claim.status) && claimMatchesExpected(claim, requirement.value)
  );
  if (confirmed) {
    return {
      requirementId: requirement.id,
      sourceClaimId: confirmed.id,
      criterionType: "REQUIREMENT",
      criterionKey: requirement.field,
      status: "MATCH",
      priority: requirement.priority,
      hardConstraint,
      scoreDelta: matchScore,
      expectedValue: requirement.value,
      actualValue: confirmed.value,
      explanation: `A current evidence-backed provider claim supports this requirement.`,
    };
  }

  const evidenceAwaitingConfirmation = matchingClaims.find(
    (claim) =>
      regulatedRequirement(requirement) &&
      claim.status === "EVIDENCE_SUPPLIED" &&
      claimMatchesExpected(claim, requirement.value)
  );
  if (evidenceAwaitingConfirmation) {
    return {
      requirementId: requirement.id,
      sourceClaimId: evidenceAwaitingConfirmation.id,
      criterionType: "REQUIREMENT",
      criterionKey: requirement.field,
      status: "UNKNOWN",
      priority: requirement.priority,
      hardConstraint,
      scoreDelta: 0,
      expectedValue: requirement.value,
      actualValue: evidenceAwaitingConfirmation.value,
      explanation: "Evidence has been supplied for this regulated requirement, but WORKS still needs source or authority confirmation before treating it as satisfied.",
    };
  }

  const reported = matchingClaims.find(
    (claim) => claim.status === "SELF_REPORTED" && claimMatchesExpected(claim, requirement.value)
  );
  if (reported) {
    return {
      requirementId: requirement.id,
      sourceClaimId: reported.id,
      criterionType: "REQUIREMENT",
      criterionKey: requirement.field,
      status: "UNKNOWN",
      priority: requirement.priority,
      hardConstraint,
      scoreDelta: 0,
      expectedValue: requirement.value,
      actualValue: reported.value,
      explanation: `The provider reports this requirement, but WORKS does not yet have supporting evidence.`,
    };
  }

  return {
    requirementId: requirement.id,
    criterionType: "REQUIREMENT",
    criterionKey: requirement.field,
    status: "UNKNOWN",
    priority: requirement.priority,
    hardConstraint,
    scoreDelta: 0,
    expectedValue: requirement.value,
    explanation: `No current claim establishes whether this requirement is satisfied.`,
  };
}

export function evaluateOfferingFit(
  brief: MatchBrief,
  offering: MatchOffering
): OfferingFitResult {
  const outcomes: MatchOutcomeDraft[] = [];

  if (offering.evidenceStatus === "SELF_REPORTED") {
    outcomes.push({
      criterionType: "EVIDENCE_BOUNDARY",
      criterionKey: "offering.self_reported",
      status: "UNKNOWN",
      hardConstraint: true,
      scoreDelta: 0,
      actualValue: "SELF_REPORTED",
      explanation: "The provider supplied this offering information. WORKS still needs supporting evidence before presenting it as a confirmed fit.",
    });
  }

  if (
    offering.evidenceStatus !== "SELF_REPORTED" &&
    offering.evidenceAgeDays != null &&
    offering.evidenceAgeDays > WORKS_EVIDENCE_FRESHNESS_DAYS
  ) {
    outcomes.push({
      criterionType: "EVIDENCE_BOUNDARY",
      criterionKey: "offering.stale",
      status: "UNKNOWN",
      hardConstraint: true,
      scoreDelta: 0,
      expectedValue: { maxAgeDays: WORKS_EVIDENCE_FRESHNESS_DAYS },
      actualValue: { ageDays: Math.floor(offering.evidenceAgeDays) },
      explanation: `This offering was last refreshed more than ${WORKS_EVIDENCE_FRESHNESS_DAYS} days ago. WORKS keeps the fit provisional until the provider information is reconfirmed.`,
    });
  }

  if (brief.categoryKey) {
    const categoryMatch = offering.categoryKeys.includes(brief.categoryKey);
    outcomes.push({
      criterionType: "CATEGORY",
      criterionKey: brief.categoryKey,
      status: categoryMatch ? "MATCH" : "NO_MATCH",
      hardConstraint: true,
      scoreDelta: categoryMatch ? 20 : -100,
      expectedValue: brief.categoryKey,
      actualValue: offering.categoryKeys,
      explanation: categoryMatch
        ? `The offering is explicitly available for ${brief.categoryKey}.`
        : `The offering is not currently scoped to ${brief.categoryKey}.`,
    });
  }

  const openSteps = brief.steps.filter(
    (step) => step.status === "NEEDED" || step.status === "UNSURE"
  );
  const coveredSteps = openSteps.filter(
    (step) => step.serviceKey && offering.serviceKeys.includes(step.serviceKey)
  );
  const coveredNeededSteps = coveredSteps.filter((step) => step.status === "NEEDED");

  for (const step of coveredSteps) {
    outcomes.push({
      stepId: step.id,
      criterionType: "PATH_STEP",
      criterionKey: step.serviceKey ?? step.title,
      status: "MATCH",
      hardConstraint: false,
      scoreDelta: step.status === "NEEDED" ? 12 : 5,
      expectedValue: step.serviceKey,
      actualValue: step.serviceKey,
      explanation:
        step.status === "NEEDED"
          ? `This offering can complete the ${step.title} step.`
          : `This offering could complete ${step.title} if that uncertain step becomes necessary.`,
    });
  }

  if (coveredSteps.length === 0) {
    outcomes.push({
      criterionType: "PATH_COVERAGE",
      criterionKey: "open_steps",
      status: "NO_MATCH",
      hardConstraint: true,
      scoreDelta: -100,
      expectedValue: openSteps.map((step) => step.serviceKey),
      actualValue: offering.serviceKeys,
      explanation: `The offering does not cover any currently open production-path step.`,
    });
  }

  const quantityRelevant = offering.serviceKeys.some((service) =>
    QUANTITY_BEARING_SERVICES.has(service)
  );

  const minimumQuantity = brief.minimumQuantity ?? brief.targetQuantity ?? null;
  const preferredQuantity = brief.preferredQuantity ?? brief.targetQuantity ?? null;
  const maximumQuantity = brief.maximumQuantity ?? brief.targetQuantity ?? null;

  if (
    quantityRelevant &&
    minimumQuantity != null &&
    maximumQuantity != null &&
    brief.quantityUnit
  ) {
    const expectedRange = {
      minimum: minimumQuantity,
      preferred: preferredQuantity,
      maximum: maximumQuantity,
      unit: brief.quantityUnit,
    };

    const providerUnit = offering.moqUnit ?? offering.maxRunUnit ?? null;
    const unitsConflict = Boolean(
      (offering.moqUnit && offering.moqUnit !== brief.quantityUnit) ||
      (offering.maxRunUnit && offering.maxRunUnit !== brief.quantityUnit)
    );

    if (offering.moqValue == null && offering.maxRunValue == null) {
      outcomes.push({
        criterionType: "QUANTITY",
        criterionKey: "quantity_range",
        status: "UNKNOWN",
        hardConstraint: true,
        scoreDelta: 0,
        expectedValue: expectedRange,
        explanation: `The offering's supported production quantity is not yet confirmed.`,
      });
    } else if (unitsConflict) {
      outcomes.push({
        criterionType: "QUANTITY",
        criterionKey: "quantity_range",
        status: "UNKNOWN",
        hardConstraint: true,
        scoreDelta: 0,
        expectedValue: expectedRange,
        actualValue: {
          minimum: offering.moqValue,
          maximum: offering.maxRunValue,
          unit: providerUnit,
        },
        explanation: `The brief and offering use different quantity units, so WORKS needs a conversion fact before comparing them safely.`,
      });
    } else if (offering.moqValue != null && offering.moqValue > maximumQuantity) {
      outcomes.push({
        criterionType: "QUANTITY",
        criterionKey: "quantity_range",
        status: "NO_MATCH",
        hardConstraint: true,
        scoreDelta: -100,
        expectedValue: expectedRange,
        actualValue: { minimum: offering.moqValue, unit: providerUnit },
        explanation: `The provider's confirmed minimum is above the founder's maximum workable first run.`,
      });
    } else if (offering.maxRunValue != null && offering.maxRunValue < minimumQuantity) {
      outcomes.push({
        criterionType: "QUANTITY",
        criterionKey: "quantity_range",
        status: "NO_MATCH",
        hardConstraint: true,
        scoreDelta: -100,
        expectedValue: expectedRange,
        actualValue: { maximum: offering.maxRunValue, unit: providerUnit },
        explanation: `The provider's confirmed maximum is below the founder's minimum workable first run.`,
      });
    } else {
      const preferredFits =
        preferredQuantity != null &&
        (offering.moqValue == null || preferredQuantity >= offering.moqValue) &&
        (offering.maxRunValue == null || preferredQuantity <= offering.maxRunValue);

      outcomes.push({
        criterionType: "QUANTITY",
        criterionKey: "quantity_range",
        status: "MATCH",
        hardConstraint: true,
        scoreDelta: preferredFits ? 16 : 14,
        expectedValue: expectedRange,
        actualValue: {
          minimum: offering.moqValue,
          maximum: offering.maxRunValue,
          unit: providerUnit ?? brief.quantityUnit,
        },
        explanation: preferredFits
          ? `The provider's confirmed quantity range includes the founder's preferred first run.`
          : `The provider's confirmed quantity range overlaps the founder's workable first-run range.`,
      });
    }
  }

  for (const requirement of brief.requirements) {
    const outcome = evaluateRequirement(requirement, offering);
    if (outcome) outcomes.push(outcome);
  }

  if (brief.locationPreference && brief.administrativeArea) {
    const areas = new Set(
      [offering.providerAdministrativeArea, ...offering.providerLocationAreas]
        .filter(Boolean)
        .map((area) => normalise(area))
    );
    const requestedArea = normalise(brief.administrativeArea);
    const locationMatch = areas.has(requestedArea);
    const mustMatch = brief.locationPreference === "MUST_AREA";

    outcomes.push({
      criterionType: "LOCATION",
      criterionKey: "administrative_area",
      status: locationMatch ? "MATCH" : areas.size > 0 ? "NO_MATCH" : "UNKNOWN",
      hardConstraint: mustMatch,
      scoreDelta: locationMatch ? 6 : mustMatch ? -100 : areas.size > 0 ? -2 : 0,
      expectedValue: brief.administrativeArea,
      actualValue: Array.from(areas),
      explanation: locationMatch
        ? `The provider has a known location in ${brief.administrativeArea}.`
        : areas.size > 0
          ? mustMatch
            ? `No known provider location is in the required area.`
            : `The provider is outside the preferred area, but location is only a preference.`
          : `The provider's location is not yet sufficiently structured to evaluate this preference.`,
    });
  }

  const hardFailure = outcomes.some(
    (outcome) => outcome.hardConstraint && outcome.status === "NO_MATCH"
  );
  const hardUnknown = outcomes.some(
    (outcome) => outcome.hardConstraint && outcome.status === "UNKNOWN"
  );

  let status: WorksMatchStatusValue;
  if (hardFailure || coveredSteps.length === 0) {
    status = "NO_MATCH";
  } else if (hardUnknown || coveredNeededSteps.length === 0) {
    status = "UNKNOWN";
  } else {
    status = "MATCH";
  }

  const fitScore = Math.max(
    0,
    Math.min(100, outcomes.reduce((total, outcome) => total + outcome.scoreDelta, 0))
  );

  return {
    status,
    fitScore,
    coveredStepCount: coveredSteps.length,
    matchedCount: outcomes.filter((outcome) => outcome.status === "MATCH").length,
    unknownCount: outcomes.filter((outcome) => outcome.status === "UNKNOWN").length,
    failedCount: outcomes.filter((outcome) => outcome.status === "NO_MATCH").length,
    outcomes,
  };
}
