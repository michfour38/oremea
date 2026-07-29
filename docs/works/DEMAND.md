# WORKS demand and production paths

WORKS demand begins with a founder's product brief and becomes a production path before matching begins.

```text
works_product_briefs
    ├── works_requirements
    └── works_production_paths
            └── works_production_steps
                    └── works_services (optional)
```

## Product brief

A brief preserves:

- market and product category
- free-text product description/type
- product stage
- target quantity and unit
- what the founder already has
- what help they requested
- geography preference
- timeline/contact details when supplied
- structured requirements

Stages and other discoverable product vocabulary remain string-based so real demand can expand the taxonomy without a schema migration.

## Requirements

Requirements use stable field keys plus JSON values and one of:

```text
REQUIRED
PREFERRED
OPTIONAL
```

A requirement can also be scoped to the production service it constrains. This prevents a requirement from being applied to unrelated route contributors.

Examples:

```text
capability.BOTTLING = BOTTLING
  applies to PACKAGING

packaging.format = BOTTLE
  applies to PACKAGING_SUPPLY

credential.HALAAL = HALAAL
  applies to MANUFACTURING
```

A label printer therefore does not need a Halaal credential merely because Halaal is required somewhere in the production route.

Eligibility and ranking consume these requirements later. A missing fact must remain UNKNOWN rather than being treated as either a match or failure.

## Production paths

Paths are versioned. Regenerating a route should create a new version rather than erase the previous route.

Steps use:

```text
COMPLETE
NEEDED
UNSURE
NOT_APPLICABLE
```

and preserve their origin:

```text
SYSTEM_GENERATED
USER_ADDED
SUPPLIER_RECOMMENDED
```

A step can reference a standard WORKS service or remain custom. User-added steps therefore do not require taxonomy changes.

`PACKAGING_SUPPLY` and `PACKAGING` are deliberately separate:

```text
PACKAGING_SUPPLY = obtain the empty bottle, jar, pouch, carton, etc.
PACKAGING        = fill or pack the finished product into that format.
```

A packaging supplier can therefore satisfy the bottle-supply step without being represented as a bottling facility.

## First fixture: 500-bottle chilli sauce

Input:

```text
Market: ZA
Category: FOOD
Product: Chilli sauce
Stage: FORMULA_READY
Quantity: 500 UNITS
Location: Gauteng preferred
Already have: FORMULA
Requested: MANUFACTURING, PACKAGING, PRINTING
Required capability: BOTTLING -> PACKAGING
Required packaging: BOTTLE -> PACKAGING_SUPPLY
Required certification: HALAAL -> MANUFACTURING
```

Expected generated path:

```text
✓ Formula or recipe
? Testing and analysis
? Compliance and certification
○ Packaging supply
○ Manufacturing
○ Packaging and filling
○ Labels and printed packaging
```

Testing remains uncertain because the founder has not yet established whether additional testing is needed. Compliance support is also uncertain: a suitable manufacturing route may already satisfy the Halaal requirement without a separate consultant. Halaal itself remains a hard manufacturing requirement.

## Editing

`lib/works/paths/add-production-step.ts` implements the `+ Add a step` behaviour. A custom step is appended to the current path with `USER_ADDED` provenance and can optionally link to an existing WORKS service.
