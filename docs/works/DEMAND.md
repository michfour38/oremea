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

Examples:

```text
capability.BOTTLING = BOTTLING
packaging.format = BOTTLE
credential.HALAAL = HALAAL
```

Eligibility and ranking will consume these requirements later. A missing fact must remain UNKNOWN rather than being treated as either a match or failure.

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
Required capability: BOTTLING
Required packaging: BOTTLE
Required certification: HALAAL
```

Expected generated path:

```text
✓ Formula or recipe
? Testing and analysis
○ Compliance and certification
○ Manufacturing
○ Packaging and filling
○ Labels and printed packaging
```

The path deliberately leaves testing uncertain and marks Halaal/compliance as needed. Matching must determine what the current provider graph can actually satisfy.

## Editing

`lib/works/paths/add-production-step.ts` implements the `+ Add a step` behaviour. A custom step is appended to the current path with `USER_ADDED` provenance and can optionally link to an existing WORKS service.
