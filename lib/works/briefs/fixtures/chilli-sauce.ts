import type { CreateProductBriefInput } from "@/lib/works/briefs/create-product-brief";

export const CHILLI_SAUCE_BRIEF_FIXTURE = {
  marketSlug: "za",
  categoryKey: "FOOD",
  productDescription:
    "A bottled chilli sauce with an existing recipe, ready for a first commercial production run.",
  productType: "Chilli sauce",
  stage: "FORMULA_READY",
  targetQuantity: 500,
  quantityUnit: "UNITS",
  locationPreference: "PREFER_AREA",
  administrativeArea: "Gauteng",
  existingAssets: ["FORMULA"],
  requestedServiceKeys: ["MANUFACTURING", "PACKAGING", "PRINTING"],
  requirements: [
    {
      requirementType: "CAPABILITY",
      field: "capability.BOTTLING",
      value: "BOTTLING",
      displayValue: "The production route must support bottling.",
    },
    {
      requirementType: "PACKAGING",
      field: "packaging.format",
      value: "BOTTLE",
      displayValue: "Bottle packaging is required.",
    },
    {
      requirementType: "CERTIFICATION",
      field: "credential.HALAAL",
      value: "HALAAL",
      displayValue: "Halaal is required for the production route.",
    },
  ],
} satisfies CreateProductBriefInput;
