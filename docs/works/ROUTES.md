# WORKS production routes v1

WORKS route planning combines current offering matches into a practical production route. A route is derived intelligence, never a replacement for the underlying provider facts, claims, evidence, brief, or path.

## Flow

```text
Product brief
    ↓
Production path
    ↓
Offering matches
    ↓
Route planner
    ↓
Recommended route + alternatives
```

A provider only needs to contribute to part of the route. WORKS optimizes the combination rather than demanding one supplier do everything.

## Persisted route objects

```text
works_route_options
    └── works_route_assignments
            ├── works_production_steps
            ├── works_matches
            └── works_offerings
```

Route calculations are versioned through `is_current`. Recalculation retires the previous route options but preserves their history.

## Route states

```text
VIABLE
POTENTIAL
INCOMPLETE
```

- `VIABLE`: every required open step has a selected contributor and no selected step has an unresolved hard fact.
- `POTENTIAL`: every required open step has a contributor, but one or more selected steps still carry a hard UNKNOWN.
- `INCOMPLETE`: at least one required open step has no current eligible contributor.

## V1 optimization order

The route planner considers:

1. route status: VIABLE before POTENTIAL before INCOMPLETE
2. fewer hand-offs
3. fewer distinct providers
4. fewer unresolved hard requirements
5. stronger internal fit/evidence score

Within candidate generation it also rewards geography fit, evidence-backed match outcomes, and keeping adjacent work with the same provider.

The score is internal ranking machinery. Public UI should explain the route in plain language rather than displaying a percentage.

## Step-level uncertainty

Uncertainty is scoped to the step where it matters.

For example, one Catercorp offering can cover packaging supply, manufacturing, filling and labelling. Its manufacturing contribution may remain UNKNOWN because Halaal scope and the 500-unit/375-kg quantity comparison are unresolved, while its bottle-supply contribution can still be confirmed for that step.

## Chilli-sauce fixture: expected route shape

The current fixture has these required open steps:

```text
Packaging supply
Manufacturing
Packaging and filling
Labels and printed packaging
```

The simplest expected potential route from the current seeded facts is:

```text
Packaging supply        Catercorp
Manufacturing           Catercorp   ?
Packaging and filling   Catercorp   ?
Printing                Gateway
```

This uses two providers and one provider hand-off.

The unresolved hard facts remain visible:

```text
? 500 bottles cannot yet be safely compared with Catercorp's published 375 kg minimum cook
? current authority-verified Halaal scope remains to be established
```

A stronger-evidence packaging alternative can also use Bonpak for bottle supply:

```text
Packaging supply        Bonpak
Manufacturing           Catercorp   ?
Packaging and filling   Catercorp   ?
Printing                Gateway
```

That route adds another provider/handoff, so v1 can rank it behind the simpler route while still exposing it as an alternative.

## Human-facing result

`lib/works/routes/get-route-summary.ts` converts route persistence into a UI-ready structure containing:

- ordered production steps
- provider and offering for each step
- grouped provider responsibilities
- route hand-off count
- unresolved hard facts
- uncovered gaps

The public result should answer:

> Here is the simplest current route for making this product, here is who can do each part, and here is exactly what still needs confirming.

## End-to-end fixture

`lib/works/routes/fixtures/run-chilli-sauce-route.ts` runs:

```text
createProductBrief
→ calculateBriefMatches
→ planBriefRoutes
→ getRouteSummary
```

This fixture is code-complete but has not been executed against Railway from the GitHub connector. Database migrations, Prisma generation, seeds, and runtime execution still need to occur in an environment with repository/database execution access.
