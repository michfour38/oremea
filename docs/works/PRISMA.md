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
│   ├── verification.prisma        # provider sources, versioned claims, evidence
│   └── credentials.prisma         # credential authorities, market links, credential claim detail
├── migrations/
│   ├── 20260728113000_add_works_markets/
│   ├── 20260728180000_add_works_locales/
│   ├── 20260729070000_add_works_categories/
│   ├── 20260729073000_add_works_providers/
│   ├── 20260729080000_add_works_provider_types/
│   ├── 20260729083000_add_works_verification_spine/
│   └── 20260729090000_add_works_credentials/
└── seeds/
    └── works/
        ├── markets.ts
        ├── locales.ts
        ├── categories.ts
        ├── provider-types.ts
        ├── credential-authorities.ts
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
- Prefer extensible string keys for discoverable taxonomies such as categories and provider types; adding a niche or role should not require a Prisma enum migration.
- Keep global category identity separate from market enablement and locale-specific labels.
- A provider is canonical globally. Country-specific presence, location, service area, and export behaviour belong in `works_provider_markets`.
- Providers can be organizations or individuals because WORKS matches both businesses and professionals.
- A provider type describes what the provider is in the production ecosystem. Services and capabilities describe the work it can actually perform. Keep those layers separate.
- Provider type labels and descriptions are locale-linked; provider records store type relationships, not presentation copy.
- Provider facts are claims. A claim must retain its source/evidence trail and its verification state.
- Updating a claim creates a new version linked through `supersedes_claim_id`; old values remain queryable for audit/history.
- Use stable `field` keys for the identity of a versioned fact. Examples: `profile.website`, `commercial.moq.private_label_serum`, `credential.halaal.12345`.
- `expires_at` is for facts with a real validity end date. `stale_after` is for facts that need rechecking even though they do not formally expire, such as MOQ, lead time, or current capacity.
- Payment or profile tier must never modify a claim's verification status.
- Credential authorities are canonical records. Their applicability to a country/market belongs in `works_credential_authority_markets`.
- Credential details extend a versioned `works_claims` record through a one-to-one `works_credential_claims` row. Verification history remains in the generic claim/evidence chain.
- An authority relationship identifies who can substantiate the credential; it does not automatically make the claim verified.

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
    │       └── works_provider_type_translations ← works_provider_types
    │
    ├── works_market_categories ← works_categories
    │
    ├── works_credential_authority_markets ← works_credential_authorities
    │
    └── works_provider_markets ← works_providers
                                  ├── works_provider_type_links → works_provider_types
                                  ├── works_provider_sources
                                  └── works_claims
                                          ├── works_evidence ← works_provider_sources
                                          └── works_credential_claims → works_credential_authorities
```

South Africa (`ZA`) is seeded first, followed by its default locale (`en-ZA`), the five launch categories, provider-type vocabulary, and initial credential authorities. Real provider records can now be added with provenance and credential structure from the first captured fact rather than being cleaned up later.
