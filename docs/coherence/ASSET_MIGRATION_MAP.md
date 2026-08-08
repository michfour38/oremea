# Oremea Asset Migration Map

## Purpose
Create a single traceable path from Canva master artwork to runtime assets without breaking production references or duplicating brand files.

## Rules
- Canva is the editable visual source of truth.
- GitHub is the runtime source of truth.
- Do not delete or move current runtime files until code references are confirmed and replacement assets exist.
- Use semantic lowercase kebab-case names.
- Prefer SVG for vector logos/marks where the exported artwork is truly vector and the runtime supports it; otherwise use transparent PNG.
- Prefer WebP for raster photographic/background assets where transparency/vector fidelity is not required.
- Sustain owns its full brand set in the standalone `michfour38/sustain` repository. Oremea should keep only the Sustain assets it actually needs to present/link the product.

## Canonical Canva master names

| Canva page | Canonical name | Meaning |
|---:|---|---|
| 5 | `harmonize-hero` | Harmonize hero/brand composition |
| 6 | `harmonize-bowl` | Harmonize bowl symbol/artwork |
| 7 | `works-mark` | WORKS standalone mark |
| 8 | `works-lockup` | WORKS mark + wordmark |
| 9 | `works-lockup-powered` | WORKS lockup with Oremea attribution |
| 10 | `works-lockup-tagline` | WORKS lockup with tagline |
| 11 | `works-primary-logo` | Primary WORKS brand logo |
| 12 | `sustain-primary-logo` | Primary Sustain logo |
| 13 | `sustain-logo-tagline` | Sustain logo with tagline |
| 14 | `sustain-lockup-stacked` | Stacked Sustain lockup |
| 15 | `sustain-wordmark` | Sustain wordmark only |
| 16 | `sustain-mark` | Sustain standalone tree mark |

## Migration manifest

### Harmonize — Oremea repository

| Canva source | Current runtime asset | Canonical target | Status | Action |
|---|---|---|---|---|
| `harmonize-hero` | `public/images/harmonize/harmonize-hero.*` | `public/products/harmonize/harmonize-hero.<runtime-ext>` | Existing asset family found | Confirm code references; replace from Canva only if artwork differs; then update refs |
| `harmonize-bowl` | `public/images/harmonize/harmonize-bowl.png` + `.webp` | `public/products/harmonize/harmonize-bowl.<runtime-ext>` | Existing PNG/WebP pair found | Confirm active format/reference; keep one intentional runtime format; update refs before removing duplicate |

Harmonize also contains multiple PNG/WebP background pairs (`bg-harmonize-entry`, `loop`, `pause`, `private`, `repair`). These belong to a later raster optimization batch; do not mix that cleanup into the brand-asset migration.

### WORKS — Oremea repository

| Canva source | Current runtime asset | Canonical target | Status | Action |
|---|---|---|---|---|
| `works-mark` | `public/works/works-mark.png` | `public/products/works/works-mark.<runtime-ext>` | Existing asset found | Compare to Canva page 7; migrate after reference check |
| `works-lockup` | No exact canonical-named runtime file confirmed | `public/products/works/works-lockup.<runtime-ext>` | Export required | Export from Canva page 8 |
| `works-lockup-powered` | No exact canonical-named runtime file confirmed | `public/products/works/works-lockup-powered.<runtime-ext>` | Export required | Export from Canva page 9 |
| `works-lockup-tagline` | No exact canonical-named runtime file confirmed | `public/products/works/works-lockup-tagline.<runtime-ext>` | Export required | Export from Canva page 10 |
| `works-primary-logo` | `public/works/works-logo.png` is a likely predecessor, visual equivalence not yet proven | `public/products/works/works-primary-logo.<runtime-ext>` | Compare/export required | Compare current file to Canva page 11; use Canva export as canonical if different |

### Sustain — standalone repository

Full brand source target:

```text
assets/
  brand/
    sustain-primary-logo.<ext>
    sustain-logo-tagline.<ext>
    sustain-lockup-stacked.<ext>
    sustain-wordmark.<ext>
    sustain-mark.<ext>
```

Current Expo scaffold assets are still generic:

```text
assets/adaptive-icon.png
assets/favicon.png
assets/icon.png
assets/splash-icon.png
```

Do not overwrite these directly with the Canva files. First derive platform-safe icon/splash assets from `sustain-mark`/`sustain-primary-logo` at Expo-required dimensions and safe zones.

Oremea should later receive only the Sustain presentation asset(s) it actually renders, under:

```text
public/products/sustain/
```

rather than duplicating the entire standalone brand set.

## Reference status

Repository code search did not return reliable results for `works-logo`, `works-mark`, or `harmonize-bowl.webp`; this is not sufficient evidence that the assets are unused. Reference resolution remains required before any deletion/move.

## Current safe boundary

Ready now:
- canonical names are settled
- target directories are settled
- obvious current asset families are inventoried
- Sustain ownership boundary is settled

Blocked until Canva exports are supplied:
- WORKS pages 8–11 canonical runtime assets
- Sustain pages 12–16 canonical source exports
- exact visual comparison of existing WORKS logo to Canva primary logo

Do not deploy this migration incrementally. Complete the asset/reference batch, verify, then deploy once.
