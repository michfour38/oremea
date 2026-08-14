import {
  LegalDocument,
  type LegalSection,
} from "@/components/legal/legal-document";
import { WORKS_RETURN_LINK } from "@/src/lib/legal/legal-links";

const sections: readonly LegalSection[] = [
  {
    title: "1. Why this disclosure exists",
    paragraphs: [
      "WORKS helps users discover independent providers and business services. Some introductions or placements may create revenue for Oremea. This disclosure explains those relationships and the language WORKS uses to describe them.",
    ],
  },
  {
    title: "2. Independent businesses",
    paragraphs: [
      "A business appearing in WORKS search, a route, a public profile or an enquiry is not automatically an Oremea partner, agent, employee, franchisee, joint venturer, approved supplier or endorsed provider.",
      "An unclaimed profile may have been created from provider information, customer input, public information or Oremea research. Its presence does not establish a commercial relationship.",
    ],
  },
  {
    title: "3. Commercial relationships",
    paragraphs: [
      "Oremea may receive a listing fee, plan fee, introduction fee, referral fee, affiliate payment, commission, recurring commission, revenue share, sponsorship fee or other commercial benefit.",
      "Where a particular recommendation, introduction, link or placement is influenced by a commercial arrangement, WORKS will identify the relationship in a reasonably clear way near the relevant content or transaction.",
    ],
  },
  {
    title: "4. What payment does not buy",
    items: [
      "A credential, verification status or favourable evidence finding.",
      "A favourable review, higher customer rating or removal of honest critical feedback.",
      "A guarantee of ranking, matching, enquiry volume, acceptance, contracts or revenue.",
      "An Oremea warranty of the business's quality, capacity, compliance, financial standing or performance.",
      "The right to be described as formal, exclusive, approved or preferred unless a substantiated agreement supports that description.",
    ],
  },
  {
    title: "5. Sponsored placement and ranking",
    paragraphs: [
      "If WORKS offers paid prominence or sponsored placement, it will be labelled so that a user can distinguish the commercial placement from an ordinary search or match.",
      "Other ranking and matching signals may include stated fit, capability, location, capacity, availability, response evidence, profile completeness and current product rules. WORKS does not guarantee a fixed position.",
    ],
  },
  {
    title: "6. Referrals to business services",
    paragraphs: [
      "WORKS may introduce accounting, finance, logistics, packaging, compliance, marketing, consulting or other independent services relevant to a production journey.",
      "The independent provider decides whether to accept a user and remains responsible for its advice, checks, pricing, contract and service. Oremea does not become that supplier merely because it may receive compensation.",
    ],
  },
  {
    title: "7. Provider and customer responsibility",
    paragraphs: [
      "Users should evaluate a provider on the facts material to their own project and should not treat the word 'partner', a commercial disclosure or a WORKS introduction as a substitute for due diligence.",
      "Providers must disclose their own material conflicts and cannot present a paid plan as an Oremea endorsement.",
    ],
  },
  {
    title: "8. Current named partners",
    paragraphs: [
      "WORKS does not identify a business as a named formal or exclusive partner in this policy unless that relationship is confirmed, current and capable of substantiation. Relevant named commercial relationships, if introduced, will be disclosed in the applicable placement, offer or updated policy.",
    ],
  },
  {
    title: "9. Questions",
    paragraphs: [
      "Questions about a placement, referral or commercial relationship may be sent to support@oremea.com.",
    ],
  },
];

export default function WorksPartnerDisclosurePage() {
  return (
    <LegalDocument
      activePath="/works/partner-disclosure"
      title="WORKS Partner Disclosure"
      summary="How WORKS distinguishes independent listings, commercial referrals, sponsored placement and substantiated partnerships."
      updated="9 August 2026"
      sections={sections}
      returnLink={WORKS_RETURN_LINK}
    />
  );
}
