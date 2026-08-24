import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { worksUrl } from "@/lib/works/seo";
import { WORKS_RETURN_LINK } from "@/src/lib/legal/legal-links";

export const metadata: Metadata = {
  title: "Verification and evidence policy | WORKS",
  description: "What WORKS checks, what each evidence status means and what buyers still need to confirm directly.",
  alternates: { canonical: worksUrl("/verification") },
};

const sections: readonly LegalSection[] = [
  {
    title: "1. Purpose",
    paragraphs: [
      "This policy explains what WORKS checks, what a verification or trust indicator means and what it does not mean. It applies to profile claims, business information, documents, credentials and other evidence used in WORKS.",
    ],
  },
  {
    title: "2. Evidence states",
    paragraphs: [
      "WORKS keeps a distinction between self-reported information, source-reviewed information and stronger verified evidence. Unknown remains unknown until evidence supports a stronger claim.",
      "A profile can contain checked, unchecked and unresolved fields at the same time. The absence of a stronger indicator does not necessarily mean a statement is false; it means WORKS does not currently have sufficient evidence to treat it as confirmed.",
    ],
  },
  {
    title: "3. Verification is specific, not universal",
    paragraphs: [
      "A WORKS check confirms only the stated fact, source and point in time. It must not be read as a complete endorsement, accreditation, audit or guarantee of a business or person.",
      "A possible fit, source review or verified fact does not establish future capacity, performance, price, delivery or compliance outside the exact fact checked.",
    ],
  },
  {
    title: "4. Business-profile claims",
    paragraphs: [
      "Before granting editing access to an existing business profile, WORKS may check whether the claimant appears authorised to act for that business.",
      "Evidence may include a business-domain email, the domain associated with the business website, the claimant's stated role, direct confirmation from an existing authorised manager or other proportionate supporting information. Personal email addresses may be insufficient where a business domain is available.",
      "A pending claim has no editing authority. Verifying a claimant's relationship to a business does not verify the business's capabilities or credentials.",
    ],
  },
  {
    title: "5. Provider-supplied information and edits",
    paragraphs: [
      "A provider is responsible for information it submits about capabilities, capacity, location, availability, equipment, team, experience, credentials and business identity.",
      "New provider offering information starts as SELF_REPORTED. If a provider edits information that WORKS previously source-reviewed or verified, the changed offering returns to SELF_REPORTED until WORKS reviews the new information again. An earlier evidence badge does not carry forward to changed facts.",
    ],
  },
  {
    title: "6. Freshness and the 180-day boundary",
    paragraphs: [
      "WORKS treats reviewed or verified offering evidence as current for up to 180 days for matching purposes unless an earlier expiry, revocation, conflict or other reason requires a shorter period.",
      "After that freshness boundary, the public evidence label is downgraded to 'Previously reviewed · needs reconfirmation' and the stale evidence is not treated as a current confirmed match. A stale positive or stale negative claim becomes UNKNOWN until reconfirmed; WORKS does not use age to invent either yes or no.",
    ],
  },
  {
    title: "7. Documents, expiry and conflicting evidence",
    paragraphs: [
      "Where WORKS reviews a document, the related indicator should identify the document or fact checked and may record an issuer, reference, issue date or expiry date where available.",
      "Expired evidence, evidence past its applicable freshness period and materially conflicting evidence are treated as unresolved for matching. WORKS may request refreshed evidence, hide or downgrade an indicator, or repeat a check.",
      "A document review ordinarily checks apparent consistency with the submitted evidence. Unless expressly stated, it does not authenticate the issuing authority, detect every alteration, establish current good standing or replace verification with the relevant regulator or issuer.",
    ],
  },
  {
    title: "8. Regulated credentials",
    paragraphs: [
      "Claims involving licences, regulatory registrations, Halaal or other certifications, accreditation, safety or similar regulated requirements receive a stricter evidence boundary.",
      "Uploading a document or making a self-reported claim does not by itself turn a regulated requirement into a confirmed match. A required regulated fact is confirmed only when WORKS has the stronger source-confirmed or authority-verified evidence state applicable to that fact. Until then the outcome remains UNKNOWN.",
    ],
  },
  {
    title: "9. What WORKS does not certify",
    items: [
      "Ongoing legal, tax, labour, health-and-safety or regulatory compliance.",
      "Financial stability, creditworthiness, solvency or the ability to complete a contract.",
      "Technical quality, production tolerances, equipment condition or product fitness.",
      "B-BBEE status, certification status or licence validity unless the exact current indicator says the applicable evidence was checked.",
      "Ownership of intellectual property, insurance cover or the authority to use customer material.",
      "Future capacity, availability, delivery, price, payment or performance.",
    ],
  },
  {
    title: "10. Customer due diligence",
    paragraphs: [
      "Customers should independently confirm the information material to their project before contracting. This may include legal identity, references, samples, site visits, certifications, regulatory registrations, insurance, financial and tax matters, quality controls, capacity, pricing and contract terms.",
      "A WORKS indicator supports but does not replace that due diligence.",
    ],
  },
  {
    title: "11. Challenges and corrections",
    paragraphs: [
      "A provider or other affected person may challenge an indicator or request correction by emailing support@oremea.com with the profile, disputed statement and supporting evidence.",
      "WORKS may hide an indicator while it investigates and may ask for further evidence. Fraudulent or materially misleading submissions can result in claim rejection, removal, restriction or account suspension.",
    ],
  },
  {
    title: "12. Paid plans and independence",
    paragraphs: [
      "A free or paid WORKS plan does not buy verification, a credential, approval, a favourable finding or a stronger suitability score. Commercial participation and evidence checks are separate.",
    ],
  },
];

export default function WorksVerificationPage() {
  return (
    <LegalDocument
      activePath="/works/verification"
      title="WORKS Verification Policy"
      summary="A precise account of profile claims, evidence freshness, regulated credentials and the limits of WORKS trust indicators."
      updated="24 August 2026"
      sections={sections}
      returnLink={WORKS_RETURN_LINK}
    />
  );
}
