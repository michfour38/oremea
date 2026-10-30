# OREMEA security coverage registry — 30 October 2026

**Status:** Baseline inventory, not a certification. Every repo has its own deployment/privacy boundary. A common security policy is **not** proof a product satisfies it.

| Product | Repo | Known sensitive surfaces | Design priority | Assessment |
|---|---|---|---|---|
| OREMEA | michfour38/oremea | Identity, relational reflections, potentially sensitive personal data | User consent, Clerk authorization, AI-provider boundaries, deletion, cross-product separation | NOT TESTED |
| SUSTAIN | michfour38/sustain | Household members (including minors), captures, financial data, DAWN read-only bridge | Object-level access, sensitive-data provenance, finance owner binding | PARTIAL SOURCE REVIEW; NOT APPROVED |
| DAWN | michfour38/dawn | Owner auth, operations and restricted product summaries | Least privilege, integration allowlists, no cross-product raw data | NOT TESTED |
| WORKS | michfour38/works | Business workflows, accounts, checkout and shared-database phase | Tenant boundaries, payment security, data split roadmap | NOT TESTED |
| BinFlow | michfour38/binflow | Customer records, location/driver routes, dispatch, notifications | Operator isolation, driver access, retention of addresses/location data | NOT TESTED |
| Countress | michfour38/countress | Customer drawings, project information, connected Dropbox/Gmail | Confidential file handling, third-party tokens, export safeguards | NOT TESTED |
| The Raw Route | michfour38/the-raw-route | Planning/prototype today, potential future consumer payments and delivery addresses | Keep research/prototype read-only; payment and customer-data gates before selling | NOT TESTED |
| Be Well with Ang | Brand/app not verified as production repository | Wellbeing preferences, check-ins, journals and sessions | Separate personal-data/consent model, practitioner access | CONCEPT; NOT BUILT |
| PARTY | Independent group, no product repository established | Group membership and volunteered messages | No app-data linkage; independent governance, confidentiality limits | CONCEPT; NOT BUILT |

## Canonical prohibitions
- SUSTAIN and Be Well with Ang must **never** be marketed as studies, research opportunities or participant-recruitment programmes.
- Product feedback is for flow and usability improvements, not automatically for independent research.
- No automatic joins of household, finance, wellness or PARTY data.
- No release/production exposure of personal information with critical G1–G9 checks BLOCKED or NOT TESTED.
- No one may claim certification to ISO standards, POPIA compliance, or penetration-test coverage without independent evidence.

## Adoption workflow
1. Repo owner identifies data categories and authorised processing purposes.
2. Repo adds product-specific data inventory, request-access tests, deletion and incident plans.
3. Independent reviewer attaches verified proof to a release gate; ownership assigned.
4. Production rollout approved only after findings addressed, appropriate professional reviews and rollback preparedness.
5. Reassess on any new integration, AI model, sensitive field, product cross-link or payment workflow.

This registry is an **initial scope view** from current descriptions. Do not treat it as a complete data-flow analysis.
