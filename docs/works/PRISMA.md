# WORKS Prisma layout

WORKS uses Prisma's multi-file schema support so the product domain stays isolated from the existing Oremea schema.

## Schema location

`package.json` points Prisma at the `./prisma` directory. The root `prisma/schema.prisma` contains the shared generator, datasource, and existing Oremea models. WORKS models live under `prisma/works/`.

```text
prisma/
├── schema.prisma                  # shared generator/datasource + existing Oremea schema
├── works/
│   ├── markets.prisma             # works_markets + market lifecycle enum
│   ├── locales.prisma             # works_locales
│   ├── categories.prisma          # global categories, translations, market availability
│   ├── providers.prisma           # canonical providers + market presence/location
│   ├── provider-types.prisma      # provider roles, translations, provider/type links
│   ├── services.prisma            # buyer-facing production services + category relevance
│   ├── capabilities.prisma        # detailed operational capabilities + category relevance
│   ├── offerings.prisma           # provider-market offerings, scale, service/capability links
│   ├── verification.prisma        # provider sources, versioned claims, evidence
│   └── credentials.prisma         # credential authorities, market links, credential claim detail
├── migrations/
│   ├── 20260728113000_add_works_markets/
│   ├── 20260728180000_add_works_locales/
│   ├── 20260729070000_add_works_categories/
│   ├── 20260729073000_add_works_providers/
│   ├── 20260729080000_add_works_provider_types/
│   ├── 20260729083000_add_works_verification_spine/
│   ├── 20260729090000_add_works_credentials/
│   └── 20260729094500_add_works_supply_intelligence/
└── seeds/
    └── works/
        ├── markets.ts
        ├── locales.ts
        ├── categories.ts
        ├── provider-types.ts
        ├── credential-authorities.ts
        ├── services.ts
        ├── capabilities.ts
        └── run.ts
```

## Rules

- Keep WORKS database models in `prisma/works/`.
- Keep the `works_` prefix on WORKS table/model names.
- Keep migrations in the existing `prisma/migrations/` history.
- Keep WORKS seeds in `prisma/seeds/works/` and call them from `prisma/seeds/works/run.ts`.
- Cross-file Prisma relations are allowed; no imports are required between `.prisma` files.
- The root schema owns the single Prisma client generator and datasource.
- Do not duplicate a WORKS model in `prisma/schema.prisma`.
- Prefer extensible string keys for discoverable taxonomies such as categories, provider types, production models and quantity units; adding a niche or production pattern should not require a Prisma enum migration.
- Keep global category identity separate from market enablement and locale-specific labels.
- A provider is canonical globally. Country-specific presence, location, service area, export behaviour and offerings belong under `works_provider_markets`.
- Providers can be organizations or individuals because WORKS matches both businesses and professionals.
- A provider type describes what the provider is in the production ecosystem. Services describe buyer-facing work. Capabilities describe the detailed operations the offering can actually perform. Keep those layers separate.
- Service and capability labels are locale-linked and both can be limited to relevant categories so the questionnaire only exposes meaningful options.
- MOQ belongs to `works_offerings`, never globally to the provider. The same provider may have different MOQs for private-label, custom formulation, co-packing or other offerings.
- An offering belongs to a provider's market presence. The same canonical provider may therefore have different offerings, quantities or commercial conditions in different markets.
- Current structured offering fields (`moq_value`, lead time, sample policy, production model, etc.) are the values used by matching. Material facts should also have an offering-scoped `works_claims` version and evidence trail.
- Offering-linked claims use `offering_id`. Deleting or archiving an offering must not erase its historical claims; the foreign key uses `SET NULL` on physical deletion.
- Provider facts are claims. A claim must retain its source/evidence trail and its verification state.
- Updating a claim creates a new version linked through `supersedes_claim_id`; old values remain queryable for audit/history.
- Use stable `field` keys for the identity of a versioned fact. Examples: `profile.website`, `commercial.moq`, `commercial.lead_time`, `credential.halaal.12345`.
- `expires_at` is for facts with a real validity end date. `stale_after` is for facts that need rechecking even though they do not formally expire, such as MOQ, lead time or current capacity.
- Payment or profile tier must never modify a claim's verification status.
- Credential authorities are canonical records. Their applicability to a country/market belongs in `works_credential_authority_markets`.
- Credential details extend a versioned `works_claims` record through a one-to-one `works_credential_claims` row. Verification history remains in the generic claim/evidence chain.
- An authority relationship identifies who can substantiate the credential; it does not automatically make the claim verified.

## Supply graph

```text
works_providers
    ↓
works_provider_markets
    ↓
works_offerings
    ├── works_offering_categories → works_categories
    ├── works_offering_services → works_services
    ├── works_offering_capabilities → works_capabilities
    └── works_claims
            └── works_evidence
```

Example:

```text
Provider: ABC Labs
Market: ZA

Offering: Custom skincare manufacture
Production model: CUSTOM_FORMULATION
MOQ: 1,500 UNITS
Lead time: 42–56 days

Services:
- FORMULATION
- PROTOTYPING
- MANUFACTURING
- PACKAGING

Capabilities:
- REFORMULATION
- SAMPLE_PRODUCTION
- BLENDING
- FILLING
- BOTTLING
- LABELLING
```

The offering is the unit WORKS matches against a buyer's requirements. Provider type alone is never enough to establish eligibility.

## Trust chain

```text
works_providers
    ├── works_provider_sources
    │       └── works_evidence
    │               ↑
    └── works_claims ┘
            ├── claim history
            │   via supersedes_claim_id
            │
            └── works_credential_claims
                    └── works_credential_authorities
                            └── works_credential_authority_markets
```

Claim statuses:

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

Credential types:

```text
QUALIFICATION
PROFESSIONAL_REGISTRATION
LICENCE
ACCREDITATION
CERTIFICATION
PROFESSIONAL_MEMBERSHIP
SHORT_COURSE
EXPERIENCE_CLAIM
```

Verification methods describe how WORKS established the claim rather than who issued the underlying credential. The credential authority identifies the body that can substantiate the credential, while the evidence/source record preserves the actual check, document, register match, or confirmation.

## Current dependency order

```text
works_markets
    ├── works_locales
    │       ├── works_category_translations
    │       ├── works_provider_type_translations ← works_provider_types
    │       ├── works_service_translations ← works_services
    │       └── works_capability_translations ← works_capabilities
    │
    ├── works_market_categories ← works_categories
    │                               ├── works_service_categories ← works_services
    │                               └── works_capability_categories ← works_capabilities
    │
    ├── works_credential_authority_markets ← works_credential_authorities
    │
    └── works_provider_markets ← works_providers
                                  ├── works_provider_type_links → works_provider_types
                                  ├── works_provider_sources
                                  ├── works_offerings
                                  │       ├── works_offering_categories → works_categories
                                  │       ├── works_offering_services → works_services
                                  │       ├── works_offering_capabilities → works_capabilities
                                  │       └── works_claims
                                  │
                                  └── works_claims
                                          ├── works_evidence ← works_provider_sources
                                          └── works_credential_claims → works_credential_authorities
```

South Africa (`ZA`) is seeded first, followed by its default locale (`en-ZA`), five launch categories, provider-type vocabulary, initial credential authorities, buyer-facing services and detailed capabilities. Real provider records can now land directly into a structured offering graph with claim-level provenance.
