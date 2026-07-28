import type { WorksMarketConfig } from "./config";

export const southAfricaMarket: WorksMarketConfig = {
  code: "ZA",
  slug: "za",
  name: "South Africa",
  localName: "South Africa",
  defaultLocale: "en-ZA",
  supportedLocales: ["en-ZA"],
  currency: {
    code: "ZAR",
    symbol: "R",
  },
  callingCode: "+27",
  geography: {
    level1Name: "Province",
    values: [
      "Eastern Cape",
      "Free State",
      "Gauteng",
      "KwaZulu-Natal",
      "Limpopo",
      "Mpumalanga",
      "North West",
      "Northern Cape",
      "Western Cape",
    ],
  },
  launchStatus: "SEEDING",
  active: true,
};
