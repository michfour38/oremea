export type WorksMarketLaunchStatus =
  | "PLANNED"
  | "RESEARCHING"
  | "SEEDING"
  | "BETA"
  | "LIVE"
  | "PAUSED";

export type WorksMarketConfig = {
  code: string;
  slug: string;
  name: string;
  localName: string;
  defaultLocale: string;
  supportedLocales: string[];
  currency: {
    code: string;
    symbol: string;
  };
  callingCode: string;
  geography: {
    level1Name: string;
    values: string[];
  };
  launchStatus: WorksMarketLaunchStatus;
  active: boolean;
};
