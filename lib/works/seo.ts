export const WORKS_ORIGIN = "https://works.oremea.com";

export const WORKS_NAME = "WORKS";

export const WORKS_BUYER_TITLE =
  "Find South African manufacturers | WORKS";

export const WORKS_BUYER_DESCRIPTION =
  "Describe the product, component, formula, packaging or production service you need. WORKS maps the route and finds South African manufacturers, suppliers and specialist providers that fit the brief.";

export const WORKS_SERVICE_DESCRIPTION =
  "WORKS turns a product, component, formula, packaging or production-service need into a production route and suitable South African provider matches while keeping unconfirmed requirements visible.";

export const WORKS_PRIVATE_PATHS = [
  "/api/",
  "/my$",
  "/my/",
  "/provider$",
  "/provider/",
  "/providers/claim",
  "/providers/new",
  "/providers/verify-claim",
  "/respond$",
  "/respond/",
  "/reviews/new",
] as const;

export function worksUrl(path = "/") {
  const normalized = path === "/" ? "/" : `/${path.replace(/^\/+/, "")}`;
  return new URL(normalized, WORKS_ORIGIN).toString();
}

export const WORKS_ORGANIZATION_ID = worksUrl("/#oremea");
export const WORKS_WEBSITE_ID = worksUrl("/#website");
export const WORKS_SERVICE_ID = worksUrl("/#service");
