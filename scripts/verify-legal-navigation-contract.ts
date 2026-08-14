import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

const routes = [
  { href: "/terms", file: "app/(legal)/terms/page.tsx", scope: "oremea" },
  { href: "/privacy", file: "app/(legal)/privacy/page.tsx", scope: "oremea" },
  { href: "/refunds", file: "app/(legal)/refunds/page.tsx", scope: "oremea" },
  {
    href: "/disclaimer",
    file: "app/(legal)/disclaimer/page.tsx",
    scope: "oremea",
  },
  { href: "/conduct", file: "app/(legal)/conduct/page.tsx", scope: "oremea" },
  { href: "/cookies", file: "app/(legal)/cookies/page.tsx", scope: "oremea" },
  { href: "/paia", file: "app/(legal)/paia/page.tsx", scope: "oremea" },
  { href: "/works/terms", file: "app/works/terms/page.tsx", scope: "works" },
  {
    href: "/works/verification",
    file: "app/works/verification/page.tsx",
    scope: "works",
  },
  {
    href: "/works/reviews-policy",
    file: "app/works/reviews-policy/page.tsx",
    scope: "works",
  },
  {
    href: "/works/partner-disclosure",
    file: "app/works/partner-disclosure/page.tsx",
    scope: "works",
  },
] as const;

function source(file: string) {
  const path = resolve(root, file);
  if (!existsSync(path)) throw new Error("Missing legal route source: " + file);
  return readFileSync(path, "utf8");
}

const registry = source("src/lib/legal/legal-links.ts");
const shell = source("components/legal/legal-document.tsx");
const footer = source("components/site/site-footer.tsx");
const worksFooter = source("components/works/works-legal-footer.tsx");
const worksLayout = source("app/works/layout.tsx");

for (const route of routes) {
  const page = source(route.file);

  if (!registry.includes('href: "' + route.href + '"')) {
    throw new Error("Legal registry is missing " + route.href);
  }

  if (!page.includes("<LegalDocument")) {
    throw new Error(
      route.file + " does not use the shared LegalDocument shell",
    );
  }

  if (!page.includes('activePath="' + route.href + '"')) {
    throw new Error(route.file + " does not declare the correct activePath");
  }

  if (!page.includes('updated="9 August 2026"')) {
    throw new Error(
      route.file + " does not carry the current legal update date",
    );
  }

  if (
    route.scope === "works" &&
    !page.includes("returnLink={WORKS_RETURN_LINK}")
  ) {
    throw new Error(route.file + " does not return to WORKS");
  }
}

const returnLabelUses = shell.match(/← \{returnLink\.label\}/g)?.length ?? 0;
if (returnLabelUses < 2) {
  throw new Error(
    "LegalDocument must show return controls at the top and bottom",
  );
}

for (const required of ["LEGAL_LINKS", "WORKS_LEGAL_LINKS"]) {
  if (!footer.includes(required)) {
    throw new Error("Site footer does not use canonical " + required);
  }
  if (!worksFooter.includes(required)) {
    throw new Error("WORKS footer does not use canonical " + required);
  }
}

if (!worksLayout.includes("<WorksLegalFooter")) {
  throw new Error("WORKS routes are not wrapped with the legal footer");
}

const legalSources = routes.map((route) => source(route.file)).join("\n");
for (const stale of ["Pre-Wave", "The Current", "Paystack", "Harmonize"]) {
  if (legalSources.includes(stale)) {
    throw new Error("Stale legal product reference remains: " + stale);
  }
}

if (legalSources.includes("April 2026")) {
  throw new Error("An old April 2026 legal update date remains");
}

console.log(
  "Legal navigation contract passed for " +
    routes.length +
    " routes and both legal footers.",
);
