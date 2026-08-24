export type WorksAcquisitionAttribution = {
  landingPath: string;
  referrerHost: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
};

const STORAGE_KEY = "oremea:works:first-touch-acquisition";

function currentAttribution(): WorksAcquisitionAttribution {
  if (typeof window === "undefined") {
    return {
      landingPath: "",
      referrerHost: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmTerm: "",
      utmContent: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  let referrerHost = "";
  try {
    referrerHost = document.referrer
      ? new URL(document.referrer).hostname.toLowerCase()
      : "";
  } catch {
    referrerHost = "";
  }

  return {
    landingPath: window.location.pathname,
    referrerHost,
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    utmTerm: params.get("utm_term") ?? "",
    utmContent: params.get("utm_content") ?? "",
  };
}

function validAttribution(value: unknown): value is WorksAcquisitionAttribution {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return [
    "landingPath",
    "referrerHost",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmTerm",
    "utmContent",
  ].every((key) => typeof record[key] === "string");
}

export function captureWorksFirstTouchAttribution() {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentAttribution()));
  } catch {
    // Attribution must never block WORKS if browser storage is unavailable.
  }
}

export function readWorksFirstTouchAttribution(): WorksAcquisitionAttribution {
  if (typeof window === "undefined") return currentAttribution();

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (validAttribution(parsed)) return parsed;
    }
  } catch {
    // Fall through to the current page if browser storage is unavailable/corrupt.
  }

  const attribution = currentAttribution();
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Attribution is best-effort; conversion remains primary.
  }
  return attribution;
}
