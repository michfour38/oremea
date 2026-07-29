export type WorksQuestionAudience = "FOUNDER" | "PROVIDER" | "AUTHORITY";
export type WorksQuestionKind = "CHOICE" | "NUMBER" | "TEXT" | "CONFIRMATION";

export type WorksBridgeQuestion = {
  key: string;
  audience: WorksQuestionAudience;
  kind: WorksQuestionKind;
  prompt: string;
  purpose: string;
  requiredToResolve: string[];
  answerField?: string;
  unit?: string;
  choices?: string[];
};

export type WorksBridgeQuestionContext = {
  productType?: string | null;
  targetQuantity?: number | null;
  quantityMinimum?: number | null;
  quantityPreferred?: number | null;
  quantityMaximum?: number | null;
  quantityUnit?: string | null;
  quantityFlexibility?: string | null;
  packagingFormat?: string | null;
  providerName?: string | null;
  providerMinimumValue?: number | null;
  providerMinimumUnit?: string | null;
  fillVolumeMl?: number | null;
  fillWeightG?: number | null;
  halaalRequired?: boolean;
  halaalAuthorityRequirement?: string | null;
  halaalSpecificAuthority?: string | null;
  halaalLogoRequired?: boolean | null;
  printingNeeded?: boolean;
};

function productLabel(context: WorksBridgeQuestionContext) {
  return context.productType?.trim() || "product";
}

function providerLabel(context: WorksBridgeQuestionContext) {
  return context.providerName?.trim() || "the provider";
}

function hasQuantityRange(context: WorksBridgeQuestionContext) {
  return context.quantityMinimum != null && context.quantityMaximum != null;
}

function quantityNeedsBridge(context: WorksBridgeQuestionContext) {
  return (
    (context.targetQuantity != null || context.quantityMinimum != null) &&
    context.quantityUnit === "UNITS" &&
    context.providerMinimumValue != null &&
    Boolean(context.providerMinimumUnit) &&
    context.providerMinimumUnit !== "UNITS"
  );
}

function quantityLabel(context: WorksBridgeQuestionContext) {
  if (hasQuantityRange(context)) {
    const preferred =
      context.quantityPreferred != null
        ? `, preferably ${context.quantityPreferred}`
        : "";
    return `${context.quantityMinimum}-${context.quantityMaximum} finished units${preferred}`;
  }
  return `${context.targetQuantity} finished units`;
}

export function buildBridgeQuestions(
  context: WorksBridgeQuestionContext
): WorksBridgeQuestion[] {
  const questions: WorksBridgeQuestion[] = [];
  const product = productLabel(context);
  const provider = providerLabel(context);

  if (quantityNeedsBridge(context)) {
    if (!hasQuantityRange(context) && !context.quantityFlexibility) {
      questions.push({
        key: "FOUNDER_QUANTITY_FLEXIBILITY",
        audience: "FOUNDER",
        kind: "CHOICE",
        prompt: `How flexible is your target of ${context.targetQuantity} finished units?`,
        purpose:
          "A supplier minimum can be workable when the founder is comfortable receiving more than the initial target, while an exact or maximum quantity creates a different constraint.",
        requiredToResolve: ["QUANTITY_VIABILITY"],
        answerField: "commercial.target_quantity_flexibility",
        choices: ["EXACT", "APPROXIMATE", "AT_LEAST", "MAXIMUM"],
      });
    }

    if (!context.fillVolumeMl && !context.fillWeightG) {
      questions.push({
        key: "FOUNDER_TARGET_PACK_SIZE",
        audience: "FOUNDER",
        kind: "NUMBER",
        prompt:
          context.packagingFormat === "BOTTLE"
            ? "How much product should each finished bottle contain?"
            : "What is the target fill size for each finished unit?",
        purpose:
          "Finished-unit quantities need a pack size before WORKS can compare them with a provider minimum expressed as mass, volume or batch size.",
        requiredToResolve: ["QUANTITY_COMPARISON"],
        answerField:
          context.packagingFormat === "BOTTLE"
            ? "packaging.fill_volume_ml"
            : "packaging.fill_size",
        unit: context.packagingFormat === "BOTTLE" ? "ML" : undefined,
      });
    }

    questions.push({
      key: "PROVIDER_MINIMUM_BASIS",
      audience: "PROVIDER",
      kind: "TEXT",
      prompt: `For this ${product}, what production minimum actually applies: ${context.providerMinimumValue} ${context.providerMinimumUnit}, litres, kilograms, or another batch basis?`,
      purpose:
        "Provider marketing pages can describe vessel capacity and commercial minimums differently. WORKS needs the minimum that applies to this exact product and process.",
      requiredToResolve: ["QUANTITY_COMPARISON"],
      answerField: "provider.minimum_batch_basis",
    });

    if (context.fillVolumeMl || context.fillWeightG) {
      const fill = context.fillVolumeMl
        ? `${context.fillVolumeMl} ml`
        : `${context.fillWeightG} g`;
      questions.push({
        key: "PROVIDER_MINIMUM_BATCH_YIELD",
        audience: "PROVIDER",
        kind: "NUMBER",
        prompt: `At a ${fill} finished fill size, how many saleable units does your minimum production batch of this ${product} yield?`,
        purpose:
          "This converts the provider's production minimum into the same finished-unit language as the founder's range without assuming product density or process loss.",
        requiredToResolve: ["QUANTITY_COMPARISON"],
        answerField: "provider.minimum_batch_finished_units",
        unit: "UNITS",
      });

      questions.push({
        key: "PROVIDER_PARTIAL_FILL_POLICY",
        audience: "PROVIDER",
        kind: "TEXT",
        prompt: `The workable first run is ${quantityLabel(context)}. If your minimum batch yields more than that range, can you fill within the requested range, and how is the remaining product handled?`,
        purpose:
          "A minimum cooking batch and a minimum finished-unit order can be different commercial constraints.",
        requiredToResolve: ["QUANTITY_VIABILITY"],
        answerField: "provider.excess_batch_policy",
      });
    }
  }

  if (context.halaalRequired) {
    if (!context.halaalAuthorityRequirement) {
      questions.push({
        key: "FOUNDER_HALAAL_AUTHORITY_REQUIREMENT",
        audience: "FOUNDER",
        kind: "CHOICE",
        prompt:
          "Does your customer, retailer or export market require a particular Halaal certifying authority?",
        purpose:
          "A current recognised Halaal certification may be sufficient for one route while a retailer or export market can require a specific authority or scheme.",
        requiredToResolve: ["HALAAL_ACCEPTABILITY"],
        answerField: "credential.HALAAL.authority_requirement",
        choices: [
          "ANY_RECOGNISED_CURRENT_CERTIFICATION",
          "SPECIFIC_AUTHORITY_REQUIRED",
          "UNSURE",
        ],
      });
    }

    if (
      context.halaalAuthorityRequirement === "SPECIFIC_AUTHORITY_REQUIRED" &&
      !context.halaalSpecificAuthority
    ) {
      questions.push({
        key: "FOUNDER_HALAAL_SPECIFIC_AUTHORITY",
        audience: "FOUNDER",
        kind: "TEXT",
        prompt: "Which Halaal certifying authority or scheme is required?",
        purpose:
          "WORKS needs the actual required authority before a provider credential can be treated as satisfying that route condition.",
        requiredToResolve: ["HALAAL_ACCEPTABILITY"],
        answerField: "credential.HALAAL.specific_authority",
      });
    }

    if (context.printingNeeded && context.halaalLogoRequired == null) {
      questions.push({
        key: "FOUNDER_HALAAL_MARK_ON_LABEL",
        audience: "FOUNDER",
        kind: "CONFIRMATION",
        prompt: "Should the Halaal certification mark appear on the finished retail label?",
        purpose:
          "Logo or mark use can require separate authorization and artwork approval even when the manufacturing route is certified.",
        requiredToResolve: ["HALAAL_LABEL_USE"],
        answerField: "credential.HALAAL.logo_required",
      });
    }

    questions.push(
      {
        key: "PROVIDER_HALAAL_CERTIFICATE_DETAILS",
        audience: "PROVIDER",
        kind: "TEXT",
        prompt: `Please provide the current Halaal certifying authority, certificate/reference number, certified site and validity dates for the ${provider} facility that would manufacture this ${product}.`,
        purpose:
          "WORKS verifies the exact current credential rather than treating a general website statement as sufficient.",
        requiredToResolve: ["HALAAL_CURRENT_CERTIFICATE"],
        answerField: "credential.HALAAL.certificate_details",
      },
      {
        key: "PROVIDER_HALAAL_SCOPE",
        audience: "PROVIDER",
        kind: "TEXT",
        prompt: `Does that certification scope cover this ${product}, its ingredients and processing aids, the manufacturing process, cross-contamination controls, and private-label production at this site?`,
        purpose:
          "Halaal suitability belongs to the actual product and production process, not merely the company name.",
        requiredToResolve: ["HALAAL_SCOPE"],
        answerField: "credential.HALAAL.scope",
      },
      {
        key: "AUTHORITY_HALAAL_SCOPE_VERIFICATION",
        audience: "AUTHORITY",
        kind: "CONFIRMATION",
        prompt: `Confirm that ${provider}'s certificate is current and that its approved scope covers the proposed ${product} production route at the stated facility.`,
        purpose:
          "Authority verification upgrades the credential from provider-reported/source-confirmed to authority-verified evidence.",
        requiredToResolve: ["HALAAL_CURRENT_CERTIFICATE", "HALAAL_SCOPE"],
        answerField: "credential.HALAAL.authority_verification",
      }
    );

    if (context.printingNeeded && context.halaalLogoRequired === true) {
      questions.push({
        key: "AUTHORITY_HALAAL_LOGO_AUTHORIZATION",
        audience: "AUTHORITY",
        kind: "CONFIRMATION",
        prompt:
          "Confirm whether the Halaal mark may appear on this finished product's packaging and what product/artwork approval is required before printing.",
        purpose:
          "Certification of production and authorization to display a certifier's mark are separate facts.",
        requiredToResolve: ["HALAAL_LABEL_USE"],
        answerField: "credential.HALAAL.logo_authorization",
      });
    }
  }

  return questions;
}
