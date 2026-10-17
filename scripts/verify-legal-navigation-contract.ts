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
] as const;

function source(file: string) {
  const path = resolve(root, file);
  if (!existsSync(path)) throw new Error("Missing legal route source: " + file);
  return readFileSync(path, "utf8");
}

const registry = source("src/lib/legal/legal-links.ts");
const shell = source("components/legal/legal-document.tsx");
const footer = source("components/site/site-footer.tsx");

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

  if (!/updated="[0-9]{1,2} [A-Za-z]+ 20[0-9]{2}"/.test(page)) {
    throw new Error(
      route.file + " is missing an explicit legal update date",
    );
  }

}

const returnLabelUses = shell.match(/← \{returnLink\.label\}/g)?.length ?? 0;
if (returnLabelUses < 2) {
  throw new Error(
    "LegalDocument must show return controls at the top and bottom",
  );
}

if (!footer.includes("LEGAL_LINKS")) {
  throw new Error("Oremea footer must use canonical legal links");
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
    " Oremea routes.",
);

// Preserve the founder-approved South African footer wording.
if (!footer.includes('Local Is Lekker')) {
  throw new Error('The Contact footer must retain Local Is Lekker below South Africa');
}
