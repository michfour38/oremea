## Change purpose and users
- What changes? Which product: SUSTAIN / Be Well with Ang / PARTY / shared infrastructure?
- Which people or data types are affected?
- Does this change the reason for collecting or using data? If yes, link updated purpose and notice.

## Data governance (mandatory for personal-data changes)
- [ ] G1 Purpose/lawful basis reviewed (or documented N/A)
- [ ] G2 Data inventory and flow reviewed
- [ ] G3 Cross-user, household and product permissions tested
- [ ] G4 Notices, user control, consent where required, rights checked
- [ ] G5 Auth, injection, secrets, logging, encryption, dependency risk assessed
- [ ] G6 Retention, export/delete, backup impact reviewed
- [ ] G7 Vendors and cross-border transfers assessed
- [ ] G8 Incident/abuse impact assessed
- [ ] G9 Independent review + release evidence supplied
- [ ] Neither SUSTAIN nor Be Well with Ang is marketed or positioned as a study
- [ ] Product feedback is not repurposed for research; PARTY data stays separate

## Evidence and attack scenarios
- Tests run, relevant CI checks, threat-model changes, failing cases:
- Can a different user/household/brand read or edit this data? Show negative tests.
- Any AI text/prompt or third-party content? How is it treated as untrusted?
- Any real-money earnings, vulnerable groups or high-sensitivity records?
- Retention, deletion, incident and rollback impact:

## Approval
- Product owner:
- Privacy reviewer:
- Security reviewer:
- Release decision: PASS / NEEDS WORK / BLOCKED / NOT TESTED

**Note:** A checked box is not proof. Link test results and approvals. See docs/governance/RELEASE-GATE.md.
