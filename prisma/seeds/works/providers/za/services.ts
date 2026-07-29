import type { ProviderSeed } from "../types";

export const zaServiceProviders: ProviderSeed[] = [
  {
    name: "Food Consulting Services",
    slug: "food-consulting-services",
    legalName: "Food Consulting Services Pty (Ltd)",
    website: "https://foodconsulting.co.za/",
    email: "info@foodconsulting.co.za",
    phone: "+27 11 315 5007",
    description:
      "Independent food and product testing laboratory and food-safety consultancy with microbiological, chemical, physical and sensory testing capability.",
    administrativeArea: "Gauteng",
    locality: "Midrand",
    servesNationally: true,
    types: ["LABORATORY"],
    locations: [
      {
        key: "midrand-laboratory",
        label: "Midrand laboratory",
        locationType: "LABORATORY",
        addressLine1: "55 Lourens Drive",
        addressLine2: "Halfway House",
        administrativeArea: "Gauteng",
        locality: "Midrand",
        isPrimary: true,
      },
      {
        key: "western-cape-office",
        label: "Western Cape office",
        locationType: "OFFICE",
        administrativeArea: "Western Cape",
      },
      {
        key: "kwazulu-natal-office",
        label: "KwaZulu-Natal office",
        locationType: "OFFICE",
        administrativeArea: "KwaZulu-Natal",
      },
    ],
    sources: [
      {
        key: "home",
        name: "Food Consulting Services website",
        url: "https://foodconsulting.co.za/",
      },
      {
        key: "services",
        name: "Food Consulting Services testing services",
        url: "https://foodconsulting.co.za/services/",
      },
      {
        key: "microbiology",
        name: "Food Consulting Services microbiology services",
        url: "https://www.foodconsulting.co.za/services-microbiology.html",
      },
      {
        key: "contact",
        name: "Food Consulting Services contact page",
        url: "https://foodconsulting.co.za/contact/",
      },
    ],
    offerings: [
      {
        name: "Food and product testing",
        slug: "food-product-testing",
        description:
          "Laboratory testing across microbiological, chemical, physical and sensory areas for food, beverage and relevant cosmetic products.",
        categories: ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE"],
        services: ["TESTING"],
        capabilities: [
          "MICROBIOLOGICAL_TESTING",
          "CHEMICAL_TESTING",
          "PHYSICAL_TESTING",
          "SENSORY_TESTING",
        ],
      },
    ],
  },
  {
    name: "Bonpak",
    slug: "bonpak",
    website: "https://bonpak.co.za/",
    email: "shop@bonpak.co.za",
    phone: "+27 11 608 4990",
    description:
      "Supplier of glass and plastic packaging for food and beverage, cosmetic, fragrance, pharmaceutical and related markets, with nationwide and cross-border delivery.",
    administrativeArea: "Gauteng",
    locality: "Johannesburg",
    servesNationally: true,
    exports: true,
    types: ["PACKAGING_SUPPLIER", "PRINTER"],
    locations: [
      {
        key: "johannesburg-sales",
        label: "Johannesburg sales",
        locationType: "SALES",
        addressLine1: "Unit 1, 8 Avalon Road",
        addressLine2: "Westlake View",
        administrativeArea: "Gauteng",
        locality: "Johannesburg",
        postalCode: "1609",
        isPrimary: true,
      },
      {
        key: "cape-town-sales",
        label: "Cape Town sales",
        locationType: "SALES",
        addressLine1: "14 Inyoni Street",
        addressLine2: "Ndabeni",
        administrativeArea: "Western Cape",
        locality: "Cape Town",
        postalCode: "7405",
      },
    ],
    sources: [
      {
        key: "about",
        name: "Bonpak about page",
        url: "https://bonpak.co.za/about-us/",
      },
      {
        key: "contact",
        name: "Bonpak contact page",
        url: "https://bonpak.co.za/contact-us/",
      },
      {
        key: "bottles",
        name: "Bonpak bottle catalogue",
        url: "https://bonpak.co.za/product-category/bottles/",
      },
      {
        key: "jars",
        name: "Bonpak jar catalogue",
        url: "https://bonpak.co.za/product-category/jars/",
      },
    ],
    offerings: [
      {
        name: "Glass and plastic packaging supply",
        slug: "glass-plastic-packaging",
        description:
          "Stock packaging supply across glass and plastic containers for product brands of varying sizes.",
        categories: ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"],
        services: ["PACKAGING"],
        packagingFormats: ["BOTTLE", "JAR", "DROPPER"],
      },
      {
        name: "Bottle printing",
        slug: "bottle-printing",
        description: "On-site bottle printing offered as part of Bonpak's packaging services.",
        categories: ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"],
        services: ["PRINTING"],
        packagingFormats: ["BOTTLE"],
      },
    ],
    claims: [
      {
        field: "commercial.moq.packaging_supply",
        claimType: "COMMERCIAL",
        value: { blanketMoq: false, standardPackSizesApply: true },
        displayValue: "No blanket MOQ; standard pack sizes apply and smaller quantities may be arranged.",
        offeringSlug: "glass-plastic-packaging",
        sourceKey: "about",
        evidenceSummary:
          "Bonpak states that it has no MOQs, while website ordering uses standard pack sizes and smaller quantities can be discussed with sales.",
        staleAfterDays: 90,
      },
    ],
  },
  {
    name: "Elan Food Labelling Legislation Consulting",
    slug: "elan-food-labelling",
    website: "https://elanconsulting.co.za/",
    description:
      "South African food-labelling compliance consultancy providing product-specific label reviews, legislative applicability assessments and corrective guidance.",
    types: ["REGULATORY_CONSULTANT"],
    sources: [
      {
        key: "home",
        name: "Elan Food Labelling Legislation Consulting website",
        url: "https://elanconsulting.co.za/",
      },
    ],
    offerings: [
      {
        name: "Food label compliance review",
        slug: "food-label-compliance-review",
        description:
          "Product-specific review of South African food labels, claims, ingredient declarations, allergens and mandatory label content.",
        categories: ["FOOD", "BEVERAGE"],
        services: ["REGULATORY_SUPPORT"],
        capabilities: ["LABEL_COMPLIANCE"],
      },
      {
        name: "New product label development support",
        slug: "new-product-label-support",
        description:
          "Early-stage product classification and label-requirement support before final artwork and printing.",
        categories: ["FOOD", "BEVERAGE"],
        services: ["REGULATORY_SUPPORT"],
        capabilities: ["LABEL_COMPLIANCE"],
      },
    ],
  },
  {
    name: "Gateway Print & Packaging",
    slug: "gateway-print-packaging",
    website: "https://www.gatewaypackaging.co.za/",
    email: "info@gatewaypackaging.co.za",
    phone: "+27 11 458 6049",
    description:
      "Johannesburg packaging manufacturer producing folding cartons, product labels and speciality finishes for FMCG, food, health and beauty brands.",
    administrativeArea: "Gauteng",
    locality: "Edenvale",
    servesNationally: true,
    types: ["PRINTER", "PACKAGING_SUPPLIER", "DESIGNER"],
    locations: [
      {
        key: "edenvale-production-floor",
        label: "Edenvale production floor",
        locationType: "FACTORY",
        addressLine1: "Unit 12, Rutland Works, Keymer Road",
        administrativeArea: "Gauteng",
        locality: "Edenvale",
        isPrimary: true,
      },
    ],
    sources: [
      {
        key: "about",
        name: "Gateway Print & Packaging about page",
        url: "https://www.gatewaypackaging.co.za/about/",
      },
      {
        key: "cartons",
        name: "Gateway folding carton service",
        url: "https://gatewaypackaging.co.za/carton-printing/",
      },
      {
        key: "labels",
        name: "Gateway label service",
        url: "https://labels.gatewaypackaging.co.za/",
      },
      {
        key: "contact",
        name: "Gateway contact page",
        url: "https://www.gatewaypackaging.co.za/contact/",
      },
    ],
    offerings: [
      {
        name: "Custom folding cartons",
        slug: "custom-folding-cartons",
        description:
          "Custom printed folding cartons, sleeves and inserts for retail-ready consumer products.",
        moqValue: 500,
        moqUnit: "UNITS",
        categories: ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"],
        services: ["PRINTING", "PACKAGING"],
        capabilities: ["PACKAGING_DESIGN"],
        packagingFormats: ["BOX"],
      },
      {
        name: "Product label printing",
        slug: "product-label-printing",
        description:
          "Custom roll and sheet labels for bottles, jars and other consumer-product applications.",
        moqValue: 500,
        moqUnit: "UNITS",
        categories: ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"],
        services: ["PRINTING"],
        capabilities: ["PACKAGING_DESIGN"],
      },
    ],
    claims: [
      {
        field: "commercial.moq.custom_folding_cartons",
        claimType: "COMMERCIAL",
        value: 500,
        displayValue: "Custom folding carton MOQ starts at 500 units.",
        unit: "UNITS",
        offeringSlug: "custom-folding-cartons",
        sourceKey: "cartons",
        evidenceSummary: "Gateway publishes folding-carton minimum order quantities starting at 500 units.",
        staleAfterDays: 90,
      },
      {
        field: "commercial.moq.product_labels",
        claimType: "COMMERCIAL",
        value: 500,
        displayValue: "Custom label MOQ starts at 500 units.",
        unit: "UNITS",
        offeringSlug: "product-label-printing",
        sourceKey: "labels",
        evidenceSummary: "Gateway's label quote flow publishes a minimum order quantity of 500 units.",
        staleAfterDays: 90,
      },
    ],
  },
  {
    name: "Nexus Fulfilment",
    slug: "nexus-fulfilment",
    website: "https://nexusfulfilment.co.za/",
    phone: "+27 21 205 3212",
    description:
      "National fulfilment and logistics provider offering warehousing, 3PL fulfilment, kitting, co-packing and distribution.",
    administrativeArea: "Gauteng",
    locality: "Germiston",
    servesNationally: true,
    types: ["FULFILMENT_PROVIDER", "LOGISTICS_PROVIDER", "CO_PACKER"],
    locations: [
      {
        key: "johannesburg",
        label: "Johannesburg",
        locationType: "WAREHOUSE",
        addressLine1: "1 Calcium Road",
        addressLine2: "Wadeville, Germiston",
        administrativeArea: "Gauteng",
        locality: "Johannesburg",
        isPrimary: true,
      },
      {
        key: "cape-town",
        label: "Cape Town",
        locationType: "WAREHOUSE",
        addressLine1: "Unit B6, Arterial Industrial Estate, Range Road",
        addressLine2: "Blackheath",
        administrativeArea: "Western Cape",
        locality: "Cape Town",
      },
      {
        key: "durban",
        label: "Durban",
        locationType: "WAREHOUSE",
        addressLine1: "116 St Johns Avenue",
        addressLine2: "New Germany",
        administrativeArea: "KwaZulu-Natal",
        locality: "Durban",
      },
    ],
    sources: [
      {
        key: "services",
        name: "Nexus Fulfilment services",
        url: "https://nexusfulfilment.co.za/services/",
      },
      {
        key: "contact",
        name: "Nexus Fulfilment contact page",
        url: "https://nexusfulfilment.co.za/contact/",
      },
      {
        key: "about",
        name: "Nexus Fulfilment about page",
        url: "https://nexusfulfilment.co.za/about-us/",
      },
    ],
    offerings: [
      {
        name: "3PL warehousing and fulfilment",
        slug: "3pl-warehousing-fulfilment",
        description:
          "Stock holding, kitting, over-packing, fulfilment, distribution and real-time reporting through a national warehousing footprint.",
        categories: ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"],
        services: ["WAREHOUSING", "FULFILMENT", "LOGISTICS"],
      },
      {
        name: "Co-packing",
        slug: "co-packing",
        description:
          "Primary and secondary co-packing for products, promotional packaging, launch packs and samples.",
        productionModel: "CO_PACKING",
        categories: ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"],
        services: ["PACKAGING", "FULFILMENT"],
      },
    ],
  },
];
