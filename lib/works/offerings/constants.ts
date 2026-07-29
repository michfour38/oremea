export const WORKS_PRODUCTION_MODELS = [
  "CUSTOM_FORMULATION",
  "PRIVATE_LABEL",
  "WHITE_LABEL",
  "CUSTOM_MANUFACTURING",
  "CO_PACKING",
  "BULK_MANUFACTURING",
] as const;

export type WorksProductionModel = (typeof WORKS_PRODUCTION_MODELS)[number];

export const WORKS_QUANTITY_UNITS = [
  "UNITS",
  "KG",
  "LITRES",
  "BATCH",
  "PALLETS",
  "OTHER",
] as const;

export type WorksQuantityUnit = (typeof WORKS_QUANTITY_UNITS)[number];

export function isWorksProductionModel(value: string): value is WorksProductionModel {
  return WORKS_PRODUCTION_MODELS.includes(value as WorksProductionModel);
}

export function isWorksQuantityUnit(value: string): value is WorksQuantityUnit {
  return WORKS_QUANTITY_UNITS.includes(value as WorksQuantityUnit);
}
