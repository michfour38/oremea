export const WORKS_QUANTITY_BASES = [
  "INDIVIDUALS",
  "PACKS",
  "CASES",
  "BATCHES",
  "MEASUREMENT",
] as const;

export type WorksQuantityBasis = (typeof WORKS_QUANTITY_BASES)[number];

export const WORKS_INPUT_MEASUREMENT_UNITS = [
  "UNITS",
  "MG",
  "G",
  "KG",
  "ML",
  "LITRES",
  "OZ",
  "LB",
  "FL_OZ_US",
  "GALLON_US",
  "FL_OZ_IMPERIAL",
  "GALLON_IMPERIAL",
] as const;

export type WorksInputMeasurementUnit =
  (typeof WORKS_INPUT_MEASUREMENT_UNITS)[number];

export type NormalizedQuantityRange = {
  minimum: number;
  preferred: number | null;
  maximum: number;
  unit: "UNITS" | "KG" | "LITRES";
  raw: {
    minimum: number;
    preferred: number | null;
    maximum: number;
    basis: WorksQuantityBasis;
    amountPerBasis: number | null;
    amountUnit: WorksInputMeasurementUnit;
  };
};

function positiveNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isBasis(value: string): value is WorksQuantityBasis {
  return WORKS_QUANTITY_BASES.includes(value as WorksQuantityBasis);
}

function isMeasurementUnit(value: string): value is WorksInputMeasurementUnit {
  return WORKS_INPUT_MEASUREMENT_UNITS.includes(
    value as WorksInputMeasurementUnit
  );
}

function normaliseMeasurement(value: number, unit: WorksInputMeasurementUnit) {
  switch (unit) {
    case "UNITS":
      return { value, unit: "UNITS" as const };
    case "MG":
      return { value: value / 1_000_000, unit: "KG" as const };
    case "G":
      return { value: value / 1_000, unit: "KG" as const };
    case "KG":
      return { value, unit: "KG" as const };
    case "OZ":
      return { value: value * 0.028349523125, unit: "KG" as const };
    case "LB":
      return { value: value * 0.45359237, unit: "KG" as const };
    case "ML":
      return { value: value / 1_000, unit: "LITRES" as const };
    case "LITRES":
      return { value, unit: "LITRES" as const };
    case "FL_OZ_US":
      return { value: value * 0.0295735295625, unit: "LITRES" as const };
    case "GALLON_US":
      return { value: value * 3.785411784, unit: "LITRES" as const };
    case "FL_OZ_IMPERIAL":
      return { value: value * 0.0284130625, unit: "LITRES" as const };
    case "GALLON_IMPERIAL":
      return { value: value * 4.54609, unit: "LITRES" as const };
  }
}

export function normalizeQuantityRange(input: {
  minimum: unknown;
  preferred?: unknown;
  maximum: unknown;
  basis?: unknown;
  amountPerBasis?: unknown;
  amountUnit?: unknown;
}): NormalizedQuantityRange {
  const minimum = positiveNumber(input.minimum);
  const preferred =
    input.preferred === undefined || input.preferred === ""
      ? null
      : positiveNumber(input.preferred);
  const maximum = positiveNumber(input.maximum);

  if (minimum == null || maximum == null) {
    throw new Error("Add the minimum and maximum first-run quantities.");
  }
  if (maximum < minimum) {
    throw new Error("The maximum first-run quantity must be at least the minimum.");
  }
  if (preferred != null && (preferred < minimum || preferred > maximum)) {
    throw new Error("The preferred quantity must sit between the minimum and maximum.");
  }

  const basisValue = String(input.basis ?? "INDIVIDUALS").toUpperCase();
  if (!isBasis(basisValue)) {
    throw new Error(`Unsupported WORKS quantity basis: ${basisValue}`);
  }

  const basis = basisValue;
  const amountPerBasis =
    basis === "INDIVIDUALS" || basis === "MEASUREMENT"
      ? 1
      : positiveNumber(input.amountPerBasis);

  if (amountPerBasis == null) {
    throw new Error(
      basis === "BATCHES"
        ? "Add the amount in each batch."
        : `Add the number of individual units in each ${basis.toLowerCase().slice(0, -1)}.`
    );
  }

  const defaultAmountUnit =
    basis === "INDIVIDUALS" || basis === "PACKS" || basis === "CASES"
      ? "UNITS"
      : "KG";
  const amountUnitValue = String(input.amountUnit ?? defaultAmountUnit).toUpperCase();
  if (!isMeasurementUnit(amountUnitValue)) {
    throw new Error(`Unsupported WORKS measurement unit: ${amountUnitValue}`);
  }

  if (
    (basis === "INDIVIDUALS" || basis === "PACKS" || basis === "CASES") &&
    amountUnitValue !== "UNITS"
  ) {
    throw new Error("Individual, pack and case quantities must resolve to individual units.");
  }

  const scaledMinimum = minimum * amountPerBasis;
  const scaledPreferred = preferred == null ? null : preferred * amountPerBasis;
  const scaledMaximum = maximum * amountPerBasis;

  const normalMinimum = normaliseMeasurement(scaledMinimum, amountUnitValue);
  const normalPreferred =
    scaledPreferred == null
      ? null
      : normaliseMeasurement(scaledPreferred, amountUnitValue);
  const normalMaximum = normaliseMeasurement(scaledMaximum, amountUnitValue);

  if (
    normalMinimum.unit !== normalMaximum.unit ||
    (normalPreferred && normalPreferred.unit !== normalMinimum.unit)
  ) {
    throw new Error("WORKS could not normalize this quantity range safely.");
  }

  return {
    minimum: normalMinimum.value,
    preferred: normalPreferred?.value ?? null,
    maximum: normalMaximum.value,
    unit: normalMinimum.unit,
    raw: {
      minimum,
      preferred,
      maximum,
      basis,
      amountPerBasis:
        basis === "INDIVIDUALS" || basis === "MEASUREMENT"
          ? null
          : amountPerBasis,
      amountUnit: amountUnitValue,
    },
  };
}
