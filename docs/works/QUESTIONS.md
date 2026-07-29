# WORKS adaptive question chain

WORKS asks only the next question needed to turn an unresolved production fact into a decision.

## Audiences

```text
FOUNDER   -> product intent/specification only the founder can decide
PROVIDER  -> commercial/process facts only the supplier can confirm
AUTHORITY -> credential/scope facts that require independent verification
```

An UNKNOWN route result should therefore become a question directed to the person or authority capable of resolving it, rather than a generic request for more information.

## Chilli-sauce bridge

Current brief:

```text
500 finished bottles
Gauteng preferred
Halaal required
Catercorp minimum published in a different production unit
```

The bridge is:

### Founder

1. What fill size should each finished bottle contain?
2. Does a customer/retailer/export market require a specific Halaal certifying authority?
3. Should the Halaal mark appear on the retail label?

The founder is never asked to estimate sauce density or convert litres/kilograms.

### Provider

1. Which minimum production basis applies to this exact sauce/process?
2. At the chosen fill size, how many saleable units does the minimum batch yield?
3. If the minimum batch yields more than the requested first run, can only the requested units be filled and how is excess product handled?
4. Which current Halaal authority/certificate/site/validity applies?
5. Does the scope cover the proposed sauce, ingredients/processing aids, process, contamination controls and private-label production at that site?

### Certifying authority

1. Confirm the certificate is current.
2. Confirm the establishment/product/process scope covers the proposed production route.
3. Where a Halaal mark is required on the retail label, confirm the authorization/artwork approval route.

## Quantity rule

WORKS must not infer density or convert a provider minimum expressed in KG/LITRES/BATCH into finished units without enough evidence.

Preferred bridge:

```text
founder target pack size
        +
provider minimum batch yield at that pack size
        =
finished-unit quantity comparison
```

This is safer than a generic mass/volume conversion because process losses, formulation density, vessel working volume and supplier commercial policy can all affect the actual finished yield.

## Persistence

Founder answers are stored as brief requirements/specifications through `upsertBriefRequirement`.

Provider and authority answers belong in the existing provider claim/evidence/credential chain so they can be source-confirmed or authority-verified and later recalculated into matching/routes.

## Route output

`getRouteSummary` now returns `nextQuestions` alongside `unresolved` and `gaps`.

The result can therefore say:

> Here is the current route. These are the remaining questions. This is who must answer each one.

The question layer reduces as facts are supplied; resolved questions disappear on recalculation.
