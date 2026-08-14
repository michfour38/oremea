import {
  LegalDocument,
  type LegalSection,
} from "@/components/legal/legal-document";
import { WORKS_RETURN_LINK } from "@/src/lib/legal/legal-links";

const sections: readonly LegalSection[] = [
  {
    title: "1. Purpose",
    paragraphs: [
      "This policy explains what WORKS checks, what a verification or trust indicator means and what it does not mean. It applies to profile claims, business information, documents and other evidence used in WORKS.",
    ],
  },
  {
    title: "2. Verification is specific, not universal",
    paragraphs: [
      "A WORKS check confirms only the stated fact, source and point in time. It must not be read as a complete endorsement, accreditation, audit or guarantee of a business or person.",
      "A profile can contain both checked and unchecked fields. The absence of an indicator does not necessarily mean information is false; it may mean WORKS has not completed or offered that check.",
    ],
  },
  {
    title: "3. Business-profile claims",
    paragraphs: [
      "Before granting editing access to an existing business profile, WORKS may check whether the claimant appears authorised to act for that business.",
      "Evidence may include a business-domain email, the domain associated with the business website, the claimant's stated role, direct confirmation from an existing authorised manager or other proportionate supporting information.",
      "Personal email addresses may be insufficient where a business domain is available. A pending claim has no editing authority.",
    ],
  },
  {
    title: "4. Provider-supplied information",
    paragraphs: [
      "A provider is responsible for information it submits about capabilities, capacity, location, availability, equipment, team, experience, credentials and business identity.",
      "WORKS may compare information with a document, public source, direct contact or prior platform record, but does not independently validate every field before it is used in search or matching.",
    ],
  },
  {
    title: "5. Documents and credentials",
    paragraphs: [
      "Where WORKS reviews a document, the related indicator should identify the document or fact checked and may record an issuer, reference, issue date or expiry date where available.",
      "A document review ordinarily checks apparent consistency with the submitted evidence. Unless expressly stated, it does not authenticate the issuing authority, detect every alteration, establish current good standing or replace verification with the relevant regulator or issuer.",
    ],
  },
  {
    title: "6. What WORKS does not certify",
    items: [
      "Ongoing legal, tax, labour, health-and-safety or regulatory compliance.",
      "Financial stability, creditworthiness, solvency or the ability to complete a contract.",
      "Technical quality, production tolerances, equipment condition or product fitness.",
      "B-BBEE status, certification status or licence validity unless the exact indicator says that evidence was checked.",
      "Ownership of intellectual property, insurance cover or the authority to use customer material.",
      "Future capacity, availability, delivery, price, payment or performance.",
    ],
  },
  {
    title: "7. Changes, expiry and re-checks",
    paragraphs: [
      "Business facts and documents can change after a check. WORKS may attach a date or expiry to an indicator, request refreshed evidence, remove an outdated indicator or repeat a check.",
      "Providers must notify WORKS if material checked information becomes inaccurate, revoked, expired or misleading.",
    ],
  },
  {
    title: "8. Customer due diligence",
    paragraphs: [
      "Customers should independently confirm the information material to their project before contracting. This may include legal identity, references, samples, site visits, certifications, regulatory registrations, insurance, financial and tax matters, quality controls, capacity, pricing and contract terms.",
      "A WORKS indicator supports but does not replace that due diligence.",
    ],
  },
  {
    title: "9. Challenges and corrections",
    paragraphs: [
      "A provider or other affected person may challenge an indicator or request correction by emailing support@oremea.com with the profile, disputed statement and supporting evidence.",
      "WORKS may hide an indicator while it investigates and may ask for further evidence. Fraudulent or materially misleading submissions can result in claim rejection, removal, restriction or account suspension.",
    ],
  },
  {
    title: "10. Paid plans and independence",
    paragraphs: [
      "A free or paid WORKS plan does not buy verification, a credential, approval or a favourable finding. Commercial participation and evidence checks are separate.",
    ],
  },
];

export default function WorksVerificationPage() {
  return (
    <LegalDocument
      activePath="/works/verification"
      title="WORKS Verification Policy"
      summary="A precise account of profile claims, evidence checks and the limits of WORKS trust indicators."
      updated="9 August 2026"
      sections={sections}
      returnLink={WORKS_RETURN_LINK}
    />
  );
}
