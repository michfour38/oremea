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
| 13 | `sustain-logo-tagline` | Sustain logo with Oremea attribution |
| 14 | `sustain-lockup-stacked` | Stacked Sustain lockup |
| 15 | `sustain-wordmark` | Sustain wordmark only |
| 16 | `sustain-mark` | Sustain standalone tree mark |

## Source export receipt — 2026-08-08

Both requested export sets were received and inspected:
- PNG: pages 7–16, transparent RGBA exports
- SVG: pages 7–16, vector exports

The filenames match the canonical names above. Visual inspection confirms the exported compositions are distinct and correctly named. The source-export gate is therefore cleared.

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
| `works-mark` | `public/works/works-mark.png` | `public/products/works/works-mark.svg` + `.png` | Source received | Add canonical pair; retain legacy path until references are resolved |
| `works-lockup` | No exact canonical-named runtime file confirmed | `public/products/works/works-lockup.svg` + `.png` | Source received | Add canonical pair |
| `works-lockup-powered` | No exact canonical-named runtime file confirmed | `public/products/works/works-lockup-powered.svg` + `.png` | Source received | Add canonical pair |
| `works-lockup-tagline` | No exact canonical-named runtime file confirmed | `public/products/works/works-lockup-tagline.svg` + `.png` | Source received | Add canonical pair |
| `works-primary-logo` | `public/works/works-logo.png` is a predecessor | `public/products/works/works-primary-logo.svg` + `.png` | Source received | Add canonical pair; retain predecessor until references are resolved |

Current branch inspection shows `public/works/works-logo.png` and `public/works/works-mark.png` are the only files presently in the legacy WORKS directory. No legacy deletion is part of this batch until reference resolution is conclusive.

### Sustain — standalone repository

Canonical brand source target:

```text
assets/
  brand/
    sustain-primary-logo.svg
    sustain-primary-logo.png
    sustain-logo-tagline.svg
    sustain-logo-tagline.png
    sustain-lockup-stacked.svg
    sustain-lockup-stacked.png
    sustain-wordmark.svg
    sustain-wordmark.png
    sustain-mark.svg
    sustain-mark.png
```

Actual Expo scaffold paths on `feature/sustain-v1` / `chore/coherence-standardization` are:

```text
assets/icon.png
assets/android-icon-foreground.png
assets/android-icon-background.png
assets/android-icon-monochrome.png
assets/favicon.png
assets/splash-icon.png
```

`app.json` currently references the first five of these directly. Platform-safe derivatives have been prepared from the canonical `sustain-mark`; the splash derivative is prepared for coherence even though the current `app.json` has no splash-screen plugin entry.

Oremea should later receive only the Sustain presentation asset(s) it actually renders, under:

```text
public/products/sustain/
```

rather than duplicating the entire standalone brand set.

## Runtime derivative rules used for Sustain

- iOS/general app icon: opaque 1024×1024 canvas with the canonical Sustain mark centered inside a safe margin.
- Android foreground: transparent 1024×1024 canvas with a conservative adaptive-icon safe footprint.
- Android background: opaque 1024×1024 neutral white field.
- Android monochrome: alpha silhouette derived from the same canonical mark geometry.
- Web favicon: transparent 512×512 derivative from the canonical mark.
- Splash icon: transparent 1024×1024 mark derivative.

No redraw or alternate logo interpretation was introduced.

## Reference status

Repository code search did not return reliable results for legacy WORKS filenames. This is not sufficient evidence that the assets are unused. Legacy files therefore remain in place until reference resolution is proven from the target branch/runtime.

## Current safe boundary

Completed:
- canonical names settled
- target directories settled
- PNG and SVG source exports received and inspected
- Sustain ownership boundary settled
- Sustain runtime derivative set prepared
- standalone Sustain migration branch created: `chore/coherence-standardization`

Still required before deployment:
- place the binary/vector asset batch into the two repositories
- confirm/update live code references to canonical WORKS paths
- validate Expo icon rendering on iOS/Android/web
- remove legacy duplicates only after reference checks pass
- run final build/test pass

Do not deploy this migration incrementally. Complete the asset/reference batch, verify, then deploy once.
