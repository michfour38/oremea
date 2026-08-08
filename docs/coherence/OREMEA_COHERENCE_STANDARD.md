# Oremea Coherence Standard

## Purpose
Create one predictable operating pattern across Oremea products without flattening their distinct purposes.

## Core rule
Standardize infrastructure, naming, assets, interaction patterns, and shared data contracts. Preserve product-specific meaning, workflows, and specialist fields.

## Repository coherence

### Product boundaries
- Oremea web platform remains the parent ecosystem.
- Standalone products may live in separate repositories when they have independent deployment, platform, or release lifecycles.
- Shared conventions must remain identical across repositories.

### Branching
- `main` is deployable production.
- Work happens on a named branch.
- Complete a coherent job before committing/deploying.
- Do not deploy every saved line.
- Prefer one deploy after the agreed work package is complete and checked.

### Directory names
Use lowercase kebab-case for directories.

Examples:
- `public/brand`
- `public/products/recognition`
- `public/products/resonance`
- `public/products/compass`
- `public/products/harmonize`
- `public/products/works`

### Asset names
Use lowercase kebab-case and describe purpose, not editing history.

Pattern:
`<product>-<asset>-<variant>.<ext>`

Examples:
- `oremea-logo-dark.webp`
- `oremea-logo-light.webp`
- `compass-logo-primary.webp`
- `works-mark-primary.webp`
- `works-logo-primary.webp`
- `recognition-hero-desktop.webp`
- `recognition-hero-mobile.webp`

Avoid:
- spaces
- `final`, `final2`, `new`, `latest`
- unexplained abbreviations
- duplicate PNG/WebP copies unless both are intentionally required

### Recommended public asset tree
```text
public/
  brand/
    oremea/
      logo-primary.webp
      logo-dark.webp
      logo-light.webp
      mark.webp
  products/
    recognition/
      logo.webp
      mark.webp
      hero-desktop.webp
      hero-mobile.webp
    resonance/
    compass/
    harmonize/
    works/
  shared/
    backgrounds/
    icons/
    illustrations/
```

## Product coherence

Every product should define the same small metadata contract:

```ts
{
  id,
  name,
  purpose,
  status,
  routes,
  logo,
  mark,
  accent,
  visibility,
  accessModel
}
```

Shared UI should read from product metadata rather than hard-coded scattered strings.

## WORKS directory coherence

WORKS should be one directory engine with specialist configurations.

Shared engine owns:
- organizations
- contacts
- locations
- capabilities
- capacity
- requirements
- credentials
- verification state
- matching
- favourites
- enquiries/connections
- profile completeness

Each directory configuration owns:
- specialist taxonomy
- requirement fields
- credential types
- filters
- matching weights
- country/legal fields
- terminology

One organization can participate in multiple directories through capability records rather than duplicate profiles.

## Design-source coherence

Canva is the visual source of truth for editable master artwork.
GitHub is the runtime source of truth for exported production assets.

For every production asset maintain a clear mapping:

```text
Canva master -> exported filename -> GitHub path -> code usage
```

Do not rename an exported asset in one layer without updating the mapping and code references in the same work package.

## Cross-project coherence

Standalone repositories such as Sustain should mirror these conventions where relevant:
- lowercase kebab-case paths
- predictable `assets/brand`, `assets/icons`, `assets/images`
- same naming grammar
- same branch/deploy discipline
- same product metadata vocabulary where concepts overlap

Shared business concepts should use the same names across products unless the product meaning genuinely differs.

## Migration rule
Do not perform a giant blind rename.

For each migration batch:
1. inventory current paths and references
2. define destination names
3. move/rename assets
4. update all code references
5. run build/tests
6. inspect key pages
7. commit one coherent batch
8. deploy once after approval

## Coherence test
A new developer should be able to predict where a file belongs and what it is called before searching for it.

If they cannot, the convention needs refinement.
