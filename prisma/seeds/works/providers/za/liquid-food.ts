import type { ProviderSeed } from "../types";

export const zaLiquidFoodProviders: ProviderSeed[] = [
  {
    name: "Catercorp",
    slug: "catercorp",
    website: "https://www.catercorp.co.za/",
    email: "info@catercorp.co.za",
    phone: "+27 11 887 5717",
    description:
      "Johannesburg manufacturer of sauces, marinades, condiments and related food products offering product development, private-label manufacturing, cooking, bottling, labelling and packaging support.",
    administrativeArea: "Gauteng",
    locality: "Johannesburg",
    servesNationally: true,
    exports: true,
    types: ["MANUFACTURER", "CO_PACKER", "FORMULATOR", "PRODUCT_DEVELOPER"],
    locations: [
      {
        key: "wynberg-factory",
        label: "Wynberg manufacturing facility",
        locationType: "FACTORY",
        addressLine1: "757 6th Street",
        addressLine2: "Wynberg",
        administrativeArea: "Gauteng",
        locality: "Johannesburg",
        postalCode: "2090",
        isPrimary: true,
      },
    ],
    sources: [
      {
        key: "about",
        name: "Catercorp about page",
        url: "https://www.catercorp.co.za/about-us/",
      },
      {
        key: "services",
        name: "Catercorp private-label and manufacturing services",
        url: "https://www.catercorp.co.za/what-we-do/",
      },
      {
        key: "development",
        name: "Catercorp research and development process",
        url: "https://www.catercorp.co.za/research-and-development/",
      },
    ],
    offerings: [
      {
        name: "Custom and private-label sauce manufacturing",
        slug: "custom-private-label-sauces",
        description:
          "Custom recipe development and private-label production for sauces, marinades and condiments, including cooking, bottling, labelling and packaging support.",
        productionModel: "CUSTOM_MANUFACTURING",
        moqValue: 375,
        moqUnit: "KG",
        categories: ["FOOD"],
        services: [
          "PRODUCT_DEVELOPMENT",
          "FORMULATION",
          "PACKAGING_SUPPLY",
          "MANUFACTURING",
          "PACKAGING",
          "LABELLING",
        ],
        capabilities: ["COOKING", "BOTTLING", "LABELLING"],
        packagingFormats: ["BOTTLE"],
        packagingSupplied: true,
      },
    ],
    claims: [
      {
        field: "commercial.minimum_cook_quantity",
        claimType: "COMMERCIAL",
        value: 375,
        displayValue: "Published minimum cooking quantity: 375 kg.",
        unit: "KG",
        offeringSlug: "custom-private-label-sauces",
        sourceKey: "services",
        evidenceSummary:
          "Catercorp publishes a minimum cooking quantity of 375 kg for its product-development and manufacturing process.",
        staleAfterDays: 90,
      },
      {
        field: "production.bottling",
        claimType: "CAPABILITY",
        value: "BOTTLING",
        displayValue: "Private-label manufacturing includes bottling into glass or plastic bottles.",
        offeringSlug: "custom-private-label-sauces",
        sourceKey: "services",
        evidenceSummary:
          "Catercorp states that it offers private-label manufacturing and bottling and can bottle into glass or plastic bottle designs.",
        staleAfterDays: 180,
      },
    ],
  },
];
