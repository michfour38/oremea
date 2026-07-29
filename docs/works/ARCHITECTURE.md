# Oremea Works architecture

WORKS lives inside the existing Oremea repository as an isolated product domain. The public experience stays simple while the provider graph, evidence, matching, permissions, and demand intelligence remain behind it.

## Product boundary

- Existing Oremea products remain untouched.
- WORKS code is namespaced under `works` in routes, components, libraries, API handlers, database models, and seed data.
- South Africa (`ZA`) is the first live market, but market/locale architecture is global from the beginning.
- Country-specific rules belong to a market configuration or market-linked database record; do not scatter raw `country` fields throughout unrelated tables.

## Route map

```text
app/
  works/
    [market]/
      page.tsx                 # Public WORKS home for a market
      providers/
        page.tsx               # Browse/search providers
        [slug]/
          page.tsx             # Provider profile
      brief/
        page.tsx               # Product brief entry
      path/
        [id]/
          page.tsx             # Generated production path
  api/
    works/
      markets/
      providers/
      briefs/
      matches/
      verification/
```

The application can initially render at `/works/za`. A future `oremea.works/za` or `za.oremea.works` domain can rewrite to the same internal route without changing the data model.

## Component map

```text
components/
  works/
    shared/                    # WORKS-only primitives
    search/                    # Search and filter UI
    providers/                 # Provider cards/profile sections
    briefs/                    # Product brief UI
    paths/                     # Production path UI
    verification/              # Evidence and credential display
    progress/                  # Profile readiness/evidence progress
    admin/                     # Internal tooling only
```

WORKS components should not be mixed into the existing generic Oremea site components unless they genuinely become cross-product primitives.

## Domain library map

```text
lib/
  works/
    markets/
      config.ts                # Market configuration contract
      resolve-market.ts        # Market/locale resolution
      za.ts                    # South Africa defaults
    categories/
      list-market-categories.ts
    providers/
      list-provider-types.ts
      profile-readiness.ts
    matching/
      eligibility.ts
      ranking.ts
      explain-match.ts
    paths/
      build-production-path.ts
      dependencies.ts
    verification/
      claim-status.ts          # Effective stale/expired/conflicting state
      create-claim-version.ts  # Preserve claim history when facts change
    permissions/
      policy.ts
    intelligence/
      demand.ts
      capacity.ts
      opportunities.ts
```

UI should consume this domain layer rather than reproducing matching or verification logic inside React components.

## Database naming

The existing Prisma schema already contains multiple Oremea product domains. WORKS tables therefore use a `works_` prefix rather than generic global names such as `Market`, `Provider`, or `Match`.

Foundation currently implemented:

```text
works_markets
works_locales
works_categories
works_category_translations
works_market_categories
works_providers
works_provider_markets
works_provider_types
works_provider_type_translations
works_provider_type_links
works_provider_sources
works_claims
works_evidence
```

Supply graph next:

```text
works_services
works_offerings
works_capabilities
works_credential_authorities
works_credential_claims
```

Demand and paths:

```text
works_product_briefs
works_requirements
works_production_paths
works_production_steps
```

Matching and intelligence:

```text
works_matches
works_match_outcomes
works_demand_aggregates
works_capacity_signals
works_opportunities
```

## Prisma location

WORKS uses Prisma's schema-folder support so the existing Oremea schema remains readable.

```text
prisma/
  schema.prisma               # Shared generator/datasource + existing Oremea models
  works/
    markets.prisma
    locales.prisma
    categories.prisma
    providers.prisma
    provider-types.prisma
    verification.prisma
  migrations/                 # Shared migration history
  seeds/
    works/
      run.ts
      markets.ts
      locales.ts
      categories.ts
      provider-types.ts
      providers/
        za/                   # South African provider research imports later
```

WORKS gets a dedicated seed runner instead of being mixed into the current Resonance room/week seed sequence.

## Market rule

A market is the local operating reality, not merely a country string.

Examples:

```text
ZA -> South Africa -> en-ZA -> ZAR
FR -> France       -> fr-FR -> EUR
DE -> Germany      -> de-DE -> EUR
```

Local regulation, credential authorities, geography, provider availability, and enabled categories attach to a market.

## Public versus private layers

Public:

```text
intent -> production path -> matching providers -> evidence explanation
```

Private/internal:

```text
provider graph
claim/evidence history
credential evidence
match outcomes
demand aggregation
capacity signals
undersupplied-market opportunities
```

The public interface should never expose internal provider lists, raw demand records, private briefs, or opportunity-generation logic.

## Trust rule

WORKS verifies specific claims rather than declaring an entire provider universally "verified".

Core chain:

```text
Provider
  ├── Source
  └── Claim
        ├── Evidence -> Source
        └── supersedes -> previous Claim
```

Stored claim states:

```text
UNKNOWN
SELF_REPORTED
EVIDENCE_SUPPLIED
SOURCE_CONFIRMED
AUTHORITY_VERIFIED
STALE
CONFLICTING
EXPIRED
```

Public language can translate those states into context-specific labels such as:

```text
REGISTER MATCHED
ISSUER CONFIRMED
QUALIFICATION VERIFIED
DOCUMENT REVIEWED
PROVIDER REPORTED
PROJECT EVIDENCED
SCOPE CONFIRMED
VERIFICATION EXPIRED
UNKNOWN
```

Every material verification status should be traceable to evidence, source, check date, and where relevant scope/expiry.

A changing fact is versioned rather than overwritten. `expires_at` represents a true validity end date; `stale_after` represents a recheck date for dynamic information such as MOQ, lead time, and current capacity.

## Profile progress rule

Provider onboarding maintains two separate measures:

1. **Profile readiness** — enough structured information to produce useful matches.
2. **Evidence coverage** — how much of the material profile information has supporting evidence.

Progress is weighted by matching usefulness. Paid features never count toward profile completion.

## First implementation sequence

1. `works_markets` ✓
2. `works_locales` ✓
3. `works_categories` + translations/market availability ✓
4. `works_providers` + `works_provider_markets` ✓
5. `works_provider_types` + translations/links ✓
6. `works_provider_sources` + versioned `works_claims` + `works_evidence` ✓
7. Credential authorities + credential claims
8. Services, capabilities, and offerings
9. First South African provider research set with provenance
10. Product brief + production path
11. Matching
12. Provider claim/onboarding workflow
13. Internal demand/capacity intelligence
14. Public WORKS face
