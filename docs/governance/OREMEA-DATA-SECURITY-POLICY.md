# OREMEA data management, privacy & security policy — v1.0 (PROPOSED)

**Status:** Draft, subject to accountable owner approval, legal review and verification. **Applies to:** every OREMEA-owned product and service, including SUSTAIN, Be Well with Ang, DAWN, WORKS, BinFlow, Countress, The Raw Route, and any future products. This repository is the organisational source of the policy; each product must independently implement and verify its own controls. **Date:** 30 October 2026.

## Operating rule

No production launch, sensitive-data migration, new third-party integration or material data-processing change without documented review of controls G1–G9 below. Policy declarations are not evidence of implementation. A **BLOCKED** or **NOT TESTED** critical control prevents release involving personal information. Only an identified accountable owner can sign off a release; a review chat or automated tool cannot certify legal compliance.

**Hard product boundary:** Neither SUSTAIN nor Be Well with Ang may be advertised, positioned, onboarded or described as a study, participant recruitment programme or research opportunity, in **any marketing**. Ordinary product feedback is for product usability improvement, not automatic research consent. The PARTY, if formed, is independent and voluntary, not an app feature or an automatic source of product data. A separate future research activity, if ever proposed, requires a separately governed project and appropriate ethics/legal decisions; **no use or linking of app records by default**.

## G1 — Purpose and lawful basis
- Record purpose, accountable owner, users, data categories, lawful basis, processing location, external recipients and retention before collection.
- Use data only for the stated purpose and compatible, authorised operations. New purposes require a recorded review and notice/consent changes as legally required; no silent repurposing.
- AI model training, marketing profiling, research, or monetisation of personal records: **off by default** and never inferred from general account terms. Do not transmit personal data to a model provider until vendor/data-transfer terms and minimisation have been approved.
- Feedback: collect only what improves clarity, navigation, accuracy and usability. Avoid coercive prompts, clinical questions and implied study consent.

## G2 — Data inventory and classification
- Maintain a current register per product, field/domain, controller, system, retention, processors, access, lawful basis and deletion method.
- Classify **PUBLIC**, **INTERNAL**, **CONFIDENTIAL PERSONAL**, and **RESTRICTED** (for health/wellness, children's information, financial details, credentials, security keys and intimate household records).
- Separate user-provided source from AI-derived inference; retain provenance. Exclude real personal data from test fixtures, screenshots and bug tickets by default.
- Required evidence: reviewed data flow diagram and data register (see DATA-INVENTORY.md).

## G3 — Product and role access boundaries
- Default deny; apply least privilege and verify user ownership and membership *on the server for every read/write*. Never accept a client-supplied profile or household ID as proof of authorisation.
- SUSTAIN household access is not consent to view private wellness journals; practitioner/admin status is not automatic permission to read clients' private records.
- Independent PARTY discussion membership never grants access to SUSTAIN, Be Well with Ang or personal reflections.
- Review role transitions, account recovery, account deletion and membership removal; prevent cross-tenant and object-ID enumeration.
- Required tests: deny one user reading, writing, exporting or deleting another user's record; deny across households, wellness profiles and products.

## G4 — Transparency, rights and consent
- Provide clear notices before collection; separate optional choices. Consent, where relied on, must be freely given, specific, informed and revocable.
- Support applicable access, correction, objection, deletion and export rights, including identity verification and lawful exceptions.
- Explicitly define private journal visibility, household-sharing rules, feedback visibility and any optional notifications.
- Children's and sensitive personal information require additional assessment, authorisation/consent and protective defaults.

## G5 — Technical and operational safeguards
- MFA required for privileged accounts and source/hosting control planes where supported; enforce strong authentication and rate limits for sign-in, recovery, sensitive endpoints and AI usage.
- Authorise every resource server-side; validate input; use parameterised queries; encode output; apply restrictive CORS and platform security headers. Protect against CSRF where cookies are used.
- TLS in transit; appropriately encrypted storage and backups; keys in managed secrets storage, never source code. Rotations and emergency revocation documented.
- Restrict production access; separation of duties for migrations, data exports and deployment; reviewed pull requests and CI security checks.
- Dependency vulnerability checks, secret scanning, static analysis and configuration reviews must have documented coverage and failure handling. No secrets or personal data in logs, analytics, crash reports, prompts, test fixtures or public bug reports.
- AI must treat user and third-party content as untrusted, not instructions. Limit tool privileges, redact data, constrain outputs, protect provenance, and test prompt-injection/data-exfiltration cases.
- Before enabling real-money household earning scales, review payment authorisation, accounting, age/capacity constraints, fraud and disputes separately; points must never silently become cash.

## G6 — Retention, rights execution and recovery
- Define retention **per data category**; do not invent a universal number. Review legal/accounting preservation needs, user expectations and backup expiry.
- Implement and test export/correction/deletion requests, vendor propagation, pseudonymisation where needed, and restore from encrypted backup.
- Backups require named owner, recovery objectives, restore drills and access review. Deletion promises must acknowledge limited backup retention where applicable.

## G7 — Suppliers, processors and international transfers
- Maintain inventory of hosting, email, push, analytics, AI, payments and community integrations, including subprocessors and countries of processing.
- Review processing agreements, security posture, breach terms, retention, and lawful cross-border transfer provisions before sending data.
- Never assume a social chat platform or external integration is confidential simply because the community is private.

## G8 — Incidents and attacks
- Follow INCIDENT-RESPONSE.md for reporting, severity classification, containment, forensics, recovery, communications and lessons learned.
- Restrict emergency access; preserve evidence while containing harm. Revoke compromised tokens and secrets; close exploitable paths before restore.
- For South Africa, evaluate POPIA section 22 notification obligations promptly; statutory phrasing is **as soon as reasonably possible**, taking necessary investigatory/remediation needs into account. Obtain counsel on affected jurisdictions and regulators.
- Prepare for account takeover, IDOR/authorisation bypass, API abuse, malicious inputs, prompt injection, vendor compromise, ransomware, insider misuse and accidental disclosure.

## G9 — Independent verification and release gate
- Each product/feature must have an approved threat model, updated data inventory, privacy assessment, code review, automated and manual security tests, recovery evidence, and a completed RELEASE-GATE.md.
- Record evidence links, owner, tested version, environment, findings, exceptions and expiry dates. A PASS requires evidence, not a statement of intent.
- External penetration testing, legal/clinical review and an ISO-related audit are risk-based decisions; never claim certification without audit/certificate.
- Re-run privacy/security impact review when collection, access, AI providers, payments, data-sharing or purpose changes.

## Ownership and review cadence
- **Responsible product owner:** accepts purpose, risk and release decisions.
- **Security/engineering owner:** implements and verifies controls.
- **Information/privacy officer:** assesses data processing and notifications.
- **Independent reviewer:** checks evidence and unresolved findings; may block release.
- Review quarterly, on material changes and immediately after relevant incidents. Named owners and contacts must be added **before production**.

## Standards reference
South Africa POPIA (especially conditions for lawful processing, security safeguards and security-compromise notification); ISO/IEC 27001:2022; ISO/IEC 27701:2025; NIST CSF 2.0 and Privacy Framework; OWASP ASVS 5.0.0. Standards are guidance/criteria, **not** a claim of certification.

Sources:
- https://inforegulator.org.za/
- https://www.gov.za/documents/protection-personal-information-act
- https://www.nist.gov/cyberframework
- https://www.nist.gov/privacy-framework
- https://owasp.org/www-project-application-security-verification-standard/
- https://www.iso.org/standard/27001
- https://www.iso.org/standard/27701
