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
    providers/
      types.ts
      profile-readiness.ts
    matching/
      eligibility.ts
      ranking.ts
      explain-match.ts
    paths/
      build-production-path.ts
      dependencies.ts
    verification/
      claim-status.ts
      expiry.ts
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

Initial foundation:

```text
works_markets
works_locales
works_categories
works_providers
works_provider_markets
```

Supply graph:

```text
works_provider_types
works_services
works_offerings
works_capabilities
works_credential_claims
works_evidence
works_provider_sources
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

```text
prisma/
  schema.prisma               # Canonical schema; WORKS models stay grouped together
  migrations/                 # Generated Prisma migrations
  seeds/
    works/
      run.ts                  # Dedicated WORKS seed runner
      markets.ts
      categories.ts
      providers/
        za/                   # South African provider seed/research imports
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
credential evidence
match outcomes
demand aggregation
capacity signals
undersupplied-market opportunities
```

The public interface should never expose internal provider lists, raw demand records, private briefs, or opportunity-generation logic.

## Trust rule

WORKS verifies specific claims rather than declaring an entire provider universally "verified".

Examples:

```text
REGISTER_MATCHED
ISSUER_CONFIRMED
QUALIFICATION_VERIFIED
DOCUMENT_REVIEWED
PROVIDER_REPORTED
PROJECT_EVIDENCED
SCOPE_CONFIRMED
VERIFICATION_EXPIRED
UNKNOWN
```

Every material verification status should be traceable to evidence, source, check date, and where relevant scope/expiry.

## Profile progress rule

Provider onboarding maintains two separate measures:

1. **Profile readiness** — enough structured information to produce useful matches.
2. **Evidence coverage** — how much of the material profile information has supporting evidence.

Progress is weighted by matching usefulness. Paid features never count toward profile completion.

## First implementation sequence

1. `works_markets`
2. `works_locales`
3. `works_categories`
4. `works_providers`
5. `works_provider_markets`
6. South Africa market seed
7. Supply graph
8. Product brief + production path
9. Matching
10. Evidence/credential workflows
11. Internal demand/capacity intelligence
12. Public WORKS face
