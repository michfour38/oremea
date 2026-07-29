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
│   └── provider-types.prisma      # provider roles, translations, provider/type links
├── migrations/
│   ├── 20260728113000_add_works_markets/
│   ├── 20260728180000_add_works_locales/
│   ├── 20260729070000_add_works_categories/
│   ├── 20260729073000_add_works_providers/
│   └── 20260729080000_add_works_provider_types/
└── seeds/
    └── works/
        ├── markets.ts
        ├── locales.ts
        ├── categories.ts
        ├── provider-types.ts
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

## Current dependency order

```text
works_markets
    ├── works_locales
    │       ├── works_category_translations
    │       └── works_provider_type_translations ← works_provider_types
    │
    ├── works_market_categories ← works_categories
    │
    └── works_provider_markets ← works_providers
                                  │
                                  └── works_provider_type_links → works_provider_types
```

South Africa (`ZA`) is seeded first, followed by its default locale (`en-ZA`), the five launch categories, and the initial provider-type vocabulary. Real provider records are intentionally not seeded until the evidence/source layer exists, so research data lands with provenance from the beginning.
