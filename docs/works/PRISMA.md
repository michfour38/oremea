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
│   └── categories.prisma          # global categories, translations, market availability
├── migrations/
│   ├── 20260728113000_add_works_markets/
│   ├── 20260728180000_add_works_locales/
│   └── 20260729070000_add_works_categories/
└── seeds/
    └── works/
        ├── markets.ts
        ├── locales.ts
        ├── categories.ts
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
- Prefer extensible string keys for discoverable taxonomies such as categories; adding a niche should not require a Prisma enum migration.
- Keep global category identity separate from market enablement and locale-specific labels.

## Current dependency order

```text
works_markets
    ↓
works_locales
    ↓
works_category_translations

works_categories
    ↓
works_category_translations
    ↓
works_market_categories ← works_markets
```

South Africa (`ZA`) is seeded first, followed by its default locale (`en-ZA`), then the five launch categories and their ZA availability/English labels.
