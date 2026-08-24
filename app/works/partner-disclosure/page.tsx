import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { worksUrl } from "@/lib/works/seo";
import { OREMEA_OPERATOR, WORKS_RETURN_LINK } from "@/src/lib/legal/legal-links";

export const metadata: Metadata = {
  title: "Provider and partner disclosure | WORKS",
  description: "How WORKS distinguishes independent provider listings, intermediary services, commercial referrals and sponsored placement.",
  alternates: { canonical: worksUrl("/partner-disclosure") },
};

const sections: readonly LegalSection[] = [
  {
    title: "1. Why this disclosure exists",
    paragraphs: [
      "WORKS helps users discover independent providers and business services. Some plans, introductions, referrals or placements may create revenue for Oremea. This disclosure explains those relationships and the language WORKS uses to describe them.",
    ],
  },
  {
    title: "2. The WORKS intermediary service",
    paragraphs: [
      "WORKS may receive or structure a customer's production requirement, identify possible independent manufacturers, suppliers or business-service providers, route selected enquiries, facilitate an introduction and retain the relevant platform record.",
      "The provider remains independent and supplies its own goods or services under its own quotation and agreement. Oremea does not become the manufacturer or underlying supplier merely because WORKS identified or introduced the provider.",
    ],
  },
  {
    title: "3. Independent businesses",
    paragraphs: [
      "A business appearing in WORKS search, a route, a public profile or an enquiry is not automatically an Oremea partner, agent, employee, franchisee, joint venturer, approved supplier or endorsed provider.",
      "An unclaimed profile may have been created from provider information, customer input, public information or Oremea research. Its presence does not establish a commercial relationship.",
    ],
  },
  {
    title: "4. Commercial relationships and compensation",
    paragraphs: [
      "Oremea may receive a listing or plan fee, introduction fee, referral fee, affiliate payment, commission, recurring commission, revenue share, sponsorship fee or another commercial benefit.",
      "Where a particular recommendation, introduction, link or placement is influenced by or connected to a commercial arrangement, WORKS will identify that relationship clearly and in writing in time for the affected user to make an informed decision. The amount will be stated where reasonably determinable; otherwise the basis used to calculate it will be described.",
      "If a relevant actual or potential conflict of interest arises, Oremea will disclose it in writing and take reasonable steps to keep the consumer's treatment fair.",
    ],
  },
  {
    title: "5. What payment does not buy",
    items: [
      "A credential, verification status or favourable evidence finding.",
      "A favourable review, higher customer rating or removal of honest critical feedback.",
      "A suitability or evidence-match score.",
      "A guarantee of enquiry volume, acceptance, contracts or revenue.",
      "An Oremea warranty of the business's quality, capacity, compliance, financial standing or performance.",
      "The right to be described as formal, exclusive, approved or preferred unless a substantiated agreement supports that description.",
    ],
  },
  {
    title: "6. Sponsored placement and ranking",
    paragraphs: [
      "If WORKS offers paid prominence or sponsored placement, it will be labelled so that a user can distinguish the commercial placement from an ordinary suitability match or evidence result.",
      "Ordinary matching uses fit and evidence factors such as capability, location, capacity, availability and unresolved requirements. A paid plan, commission or sponsorship does not change that suitability calculation.",
    ],
  },
  {
    title: "7. Consumer Protection Act intermediary disclosures",
    paragraphs: [
      `Oremea's public intermediary particulars are: ${OREMEA_OPERATOR.name}, ${OREMEA_OPERATOR.legalForm} trading as ${OREMEA_OPERATOR.tradingName}; physical business and legal-service address ${OREMEA_OPERATOR.serviceAddress}; website ${OREMEA_OPERATOR.website}; email ${OREMEA_OPERATOR.email}; telephone ${OREMEA_OPERATOR.telephone}.`,
      "Where the Consumer Protection Act intermediary rules apply to a particular relationship, Oremea will also provide the affected consumer with any additional prescribed particulars relevant to that relationship in a durable written record. Sensitive identity particulars required for a particular consumer are supplied directly rather than published indiscriminately on an indexed public page.",
      "Financial information relating to the intermediary service is given in plain language, separately enough from marketing to be recognisable as a disclosure, and before or with the relevant decision or transaction record.",
    ],
  },
  {
    title: "8. Records",
    paragraphs: [
      "Where the Consumer Protection Act requires intermediary records, Oremea retains the applicable regulation 9 disclosure information, written instructions from the consumer and, if a transaction results and advice was furnished, the advice record and its basis for at least three years. Electronic records may be retained in a form that can be reproduced in writing.",
    ],
  },
  {
    title: "9. Referrals to business services",
    paragraphs: [
      "WORKS may introduce accounting, finance, logistics, packaging, compliance, marketing, consulting or other independent services relevant to a production journey.",
      "The independent provider decides whether to accept a user and remains responsible for its advice, checks, pricing, contract and service. Oremea does not become that supplier merely because it may receive compensation.",
    ],
  },
  {
    title: "10. Current named partners",
    paragraphs: [
      "WORKS does not identify a business as a named formal or exclusive partner in this policy unless that relationship is confirmed, current and capable of substantiation. Relevant named commercial relationships, if introduced, will be disclosed in the applicable placement, offer or updated policy.",
    ],
  },
  {
    title: "11. Questions",
    paragraphs: ["Questions about a placement, referral, intermediary disclosure or commercial relationship may be sent to support@oremea.com."],
  },
];

export default function WorksPartnerDisclosurePage() {
  return (
    <LegalDocument
      activePath="/works/partner-disclosure"
      title="WORKS Partner & Intermediary Disclosure"
      summary="How WORKS distinguishes independent listings, intermediary services, commercial referrals, sponsored placement and substantiated partnerships."
      updated="24 August 2026"
      sections={sections}
      returnLink={WORKS_RETURN_LINK}
      references={[
        { label: "Consumer Protection Act 68 of 2008", href: "https://www.gov.za/sites/default/files/32186_467.pdf" },
        { label: "Consumer Protection Regulations, 2011", href: "https://www.gov.za/sites/default/files/gcis_document/201409/34180rg9515gon293.pdf" },
      ]}
    />
  );
}
