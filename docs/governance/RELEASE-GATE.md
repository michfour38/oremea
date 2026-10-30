# Release privacy/security gate — form and evidence register

This is an **evidence-based** gate; the checklist cannot approve itself. Product owner, security reviewer and privacy owner must be named. Default is **NOT TESTED**, not PASS.

## Release identification
- Product / environment / commit SHA:
- Proposed release date:
- Accountable product owner:
- Security reviewer (independent where possible):
- Privacy/information officer:
- Data inventory version and processor list:
- Prior approval / outstanding exceptions:
- External professional review required? (legal, financial, clinical, penetration test):

## Mandatory evidence (G1–G9)
| Gate | Required artefact and test | Result: PASS / NEEDS WORK / BLOCKED / NOT TESTED | Evidence URL / reviewer |
|---|---|---|---|
| G1 Purpose and lawful basis | Processing notice, approved purpose, legal basis, prohibited-use review | NOT TESTED | |
| G2 Data inventory | Field-level data map, classification, data-flow and storage locations | NOT TESTED | |
| G3 Role/product access | Server-side authorisation, adversarial cross-user/household/product tests | NOT TESTED | |
| G4 Transparency/rights | Notice, consent where required, revoke, access, export, correction, delete tests | NOT TESTED | |
| G5 Technical security | Secrets, encryption, TLS, auth/MFA, API abuse, injection, AI prompt-injection, CI results | NOT TESTED | |
| G6 Retention/recovery | Retention schedule, deletion propagation, backup restore drill and owner | NOT TESTED | |
| G7 Vendor/transfers | Subprocessor inventory, contracts, regions, cross-border assessment | NOT TESTED | |
| G8 Incident response | Named on-call contacts, alerting, tabletop exercise and breach-notice runbook | NOT TESTED | |
| G9 Independent review | Versioned findings, threat model, reviewer sign-off, unresolved risks, approvals | NOT TESTED | |

## Attack test minimum
- [ ] Anonymous requests cannot access records; auth and reset rate limiting works.
- [ ] User A cannot read, mutate, export or delete User B's household/capture/finance records.
- [ ] Changing object IDs, household IDs, user IDs or roles cannot bypass ownership.
- [ ] Private wellness journals never appear in household APIs or practitioner/admin dashboards by default.
- [ ] PARTY membership does not grant any app access; community messages are not harvested or automatically transferred.
- [ ] Attempts to inject commands via stored text, model prompts, filenames or feedback cannot alter system policies or leak unrelated records.
- [ ] API inputs enforce limits; logs, error messages and monitoring omit secrets and private narrative.
- [ ] Logout, device loss and credential compromise can invalidate sessions; privileged access can be revoked.
- [ ] Backups can be restored, encrypted access is controlled, and deletion/retention policies are tested.
- [ ] Finance and any future earning-scale ledger reject duplicate transactions and unauthorised adjustments.

## Product boundary checks
- [ ] SUSTAIN remains independently branded household memory/participation product.
- [ ] Be Well with Ang wellness data has independent person-level privacy and no automatic import.
- [ ] Neither product is marketed as a study or a research recruitment pathway; feedback is for product improvement.
- [ ] The PARTY, if launched, has independent governance and no cross-product automatic sharing.
- [ ] No claim of ISO certification, POPIA compliance or external penetration-test pass without evidence.

## Decision
- Critical controls unresolved: **BLOCK release with personal information**.
- Non-critical findings require named owner, due date, explicit risk acceptance, and defined scope; no acceptance overrides an applicable legal requirement.
- Approved by / date / tested commit / environments:
- Next review and triggers:

## Reviewer instructions
Classify every gate as PASS / NEEDS WORK / BLOCKED / NOT TESTED, link direct evidence, reproduce security issues without using production personal records, list severity and affected scope. Do not merge or deploy on the strength of this document alone.
