# WORKS matching v1

WORKS matches an offering to a product brief as a possible contributor to the production route. It does not require one provider to complete the entire route.

## Three-valued result

```text
MATCH
NO_MATCH
UNKNOWN
```

`UNKNOWN` is a first-class result. Missing evidence never becomes an assumed match or assumed failure.

## Requirement scope

Requirements apply only where they belong.

For the chilli-sauce fixture:

```text
BOTTLING -> PACKAGING
BOTTLE   -> PACKAGING_SUPPLY
HALAAL   -> MANUFACTURING
```

A bottle supplier therefore does not need a Halaal credential, and a label printer is not asked whether it can bottle sauce.

## Eligibility before ranking

Hard failures include:

- wrong product category
- confirmed MOQ above the target quantity when units are comparable
- confirmed maximum run below the target quantity
- an explicit claim that conflicts with a REQUIRED condition
- no coverage of any open production-path step

Hard unknowns include:

- required credential not yet established
- required capability not yet established
- quantity cannot be compared safely
- required commercial fact is not yet known

A hard unknown produces `UNKNOWN`, not `NO_MATCH`.

## Ranking

Internal scoring only orders otherwise comparable results. Public UI should prefer plain-language fit explanations rather than exposing a percentage.

Ranking order is:

```text
MATCH
UNKNOWN
NO_MATCH
```

then:

1. more open production steps covered
2. stronger internal fit score
3. fewer confirmed conflicts
4. fewer unresolved facts

## Chilli-sauce fixture: expected shape

This is an expected result from the currently encoded source facts. It has not yet been executed against the Railway database because the branch migrations and seeds have not been run there.

### Catercorp — Potential match

Known fit:

- FOOD
- Gauteng
- custom/private-label sauce manufacture
- cooking
- bottling
- bottle format
- packaging supply support
- manufacturing
- filling/packaging
- labelling

Still unresolved:

- the brief is `500 UNITS`, while Catercorp publishes a minimum cooking quantity of `375 KG`; WORKS must not guess the bottle size or convert units without enough information
- Catercorp publicly describes Halaal-certified product offerings, but WORKS has not yet authority-verified the current certification scope, so the hard Halaal requirement remains unresolved

Expected status: `UNKNOWN`

### Gateway product-label printing — Strong fit

Known fit:

- FOOD
- PRINTING step
- Gauteng
- published MOQ starts at 500 units

Expected status: `MATCH` for the printing contribution.

### Bonpak packaging supply — Strong fit / possible unresolved commercial detail

Known fit:

- FOOD
- PACKAGING_SUPPLY step
- bottle format
- Gauteng
- provider states there is no blanket MOQ, with standard pack sizes applying

The exact chosen bottle SKU and pack-size availability remain a later product-level check.

### Southern Right Foods — Potential match

Known fit:

- FOOD
- manufacturing and contract packing
- bottle-format packing is described

Unresolved for this brief:

- liquid-sauce suitability is not established by the current source set; the provider is primarily described around dry foods
- bottling capability is not explicitly confirmed
- MOQ is unknown
- Halaal scope is unknown

Expected status: `UNKNOWN`.

### Power Blends — Potential match with a visible mismatch signal

Known fit:

- FOOD
- Gauteng
- manufacturing and packing

Unresolved / weak fit:

- source material explicitly describes dry products
- published custom-blending MOQ is 100 KG while the brief is 500 UNITS
- bottling is not confirmed
- Halaal scope is unknown

V1 intentionally keeps this unresolved instead of inventing a unit conversion. Product form/subcategory is likely the next useful demand dimension if live searches repeatedly expose this ambiguity.

### Food Consulting Services — Potential testing contributor

The current path marks testing as `UNSURE`. FCS can service that step if testing becomes necessary, so the overall result remains `UNKNOWN` rather than being presented as a required route component.

### Elan Food Labelling — Potential regulatory contributor

The current path marks separate regulatory help as `UNSURE`. Elan can assist with food-label compliance, but this does not establish the Halaal requirement.

### Category failures

The current cosmetic and supplement manufacturing offerings are `NO_MATCH` for a FOOD brief:

- Quintessence Collections
- COSLAB
- SA-Labs

### Nexus Fulfilment

Nexus has generic co-packing and fulfilment capability, but category-specific handling suitability has deliberately not been inferred from its current public evidence. Its offerings therefore remain outside the FOOD match set until that fact is confirmed.

## Historical calculations

Recalculation marks the previous result snapshot as non-current and writes a new `works_matches` + `works_match_outcomes` snapshot. When a provider later confirms MOQ, capacity or credential status, WORKS can show exactly why the result changed.
