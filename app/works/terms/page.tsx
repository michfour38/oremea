import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { worksUrl } from "@/lib/works/seo";
import { OREMEA_OPERATOR, WORKS_RETURN_LINK } from "@/src/lib/legal/legal-links";

export const metadata: Metadata = {
  title: "Terms for customers and providers | WORKS",
  description: "The rules for WORKS customer briefs, provider profiles, matching, enquiries, plans, reviews and commercial introductions.",
  alternates: { canonical: worksUrl("/terms") },
};

const sections: readonly LegalSection[] = [
  {
    title: "1. About WORKS",
    paragraphs: [
      "WORKS is an Oremea business-discovery, production-routing, matching, lead-generation, introduction and referral service for customers and independent South African manufacturers, suppliers and business-service providers.",
      "These WORKS Terms supplement Oremea's Terms of Service. If they conflict on a WORKS-specific issue, these WORKS Terms apply to that issue. Mandatory South African rights remain unaffected.",
    ],
  },
  {
    title: "2. The parties",
    paragraphs: [
      "Oremea is operated by Michelle Fourie, a sole proprietor trading as Oremea. A customer is a person or business searching, saving a search, submitting a brief, requesting sourcing or reviewing a provider. A provider is an independent business listed, claimed, managed or contacted through WORKS.",
      "Customers and providers ordinarily contract directly with each other. Oremea is not a party to that underlying agreement unless Oremea expressly signs a separate written agreement saying otherwise.",
    ],
  },
  {
    title: "3. Searches, routes and matches",
    paragraphs: [
      "WORKS may use customer requirements, provider-supplied information, public information, evidence status and current availability or capacity signals to identify possible routes and providers.",
      "A result, route, match, shortlist, introduction or enquiry indicates possible fit based on information available at the time. It is not a guarantee of suitability, acceptance, capacity, price, payment, performance, certification, delivery, revenue or a concluded contract.",
      "Unknown, stale, expired or conflicting evidence remains unresolved until a stronger current source supports a conclusion. Commercial plan, commission or sponsorship status does not change the suitability or evidence match score.",
    ],
  },
  {
    title: "4. Customer responsibilities",
    items: [
      "Provide materially accurate requirements, timing, quantities, constraints and contact information.",
      "Have authority to submit the brief and any confidential, personal or intellectual-property material it contains.",
      "Evaluate providers independently and agree scope, price, deposit, payment, quality, inspection, delivery, confidentiality and ownership terms directly.",
      "Do not submit speculative, deceptive, abusive or unlawful enquiries or use provider information for unrelated marketing.",
      "Do not use a fit or capacity enquiry to demand unpaid formulation, engineering, design, samples, specifications or substantial technical development; detailed development work should be scoped commercially with the provider.",
    ],
  },
  {
    title: "5. Provider profiles and responsibilities",
    paragraphs: [
      "A provider must have authority to create or claim a business profile and must keep material identity, capability, capacity, location, availability, contact, plan and credential information reasonably accurate.",
      "A public profile may begin from information supplied by a business, customer, authorised representative, public source or Oremea research. An unclaimed listing does not establish endorsement, subscription or a commercial partnership.",
      "Providers decide whether to respond to an opportunity and remain responsible for their quotations, commitments, work, licences, insurance, personnel, subcontractors, compliance and customer relationship.",
    ],
  },
  {
    title: "6. Claiming and managing a business",
    paragraphs: [
      "Editing access may be limited until WORKS has checked the claimant's relationship to the business. A pending claim gives no editing or representative authority.",
      "WORKS may request a business-domain email, role information or other proportionate evidence. Verification of a claimant's relationship confirms only the checked relationship; it is not a full verification of the business.",
    ],
  },
  {
    title: "7. Plans and paid participation",
    paragraphs: [
      "A free or paid plan may affect profile tools, opportunity workflow, selected demand features, capacity tools, insights, visibility controls or other functions described on the current plan page.",
      "Paid participation does not buy credentials, verification, favourable reviews, a suitability ranking, exclusivity, a minimum number of enquiries, filled capacity, contracts or revenue. Any paid prominence offered separately must be clearly labelled as commercial placement and kept distinct from suitability matching.",
      "Prices, billing periods, renewal, cancellation and paid-access-end terms shown before purchase form part of these Terms and Oremea's Payments, Subscriptions, Cancellation and Refund Policy.",
    ],
  },
  {
    title: "8. Enquiries, responses and communications",
    paragraphs: [
      "WORKS may send selected brief information to a possible provider and record whether that provider can help, needs more information or is outside capability. WORKS limits outreach and does not treat a possible fit as verified current capacity.",
      "A provider must treat non-public brief information as confidential and use it only to assess or pursue the relevant opportunity. Customers must treat non-public provider responses, proposals and pricing on the agreed confidential basis.",
      "WORKS may facilitate communication but does not guarantee delivery, response time, authenticity of every message or successful negotiation.",
    ],
  },
  {
    title: "9. Reviews",
    paragraphs: [
      "A WORKS review may open only after an eligible substantive response to a WORKS-linked brief. A provider declining because the work is outside its capability does not, by itself, create review eligibility.",
      "A 'Verified WORKS brief' indicator means the review is linked in Oremea's records to the eligible interaction; it does not verify every factual statement or the quality of the underlying work.",
      "Reviews and provider responses are governed by the WORKS Reviews Policy. Oremea may moderate, restrict or remove content under that policy and the Community and Acceptable Use Policy.",
    ],
  },
  {
    title: "10. Verification and credentials",
    paragraphs: [
      "WORKS displays narrowly described evidence states and trust indicators. Each indicator confirms only the stated fact, source and point in time. Older reviewed evidence may be downgraded and require reconfirmation.",
      "Provider edits to reviewed or verified offering information return the changed information to self-reported status until WORKS reviews it again. For regulated credentials, an uploaded document alone is not treated as authority verification.",
      "Unless expressly identified, WORKS does not perform a legal, financial, technical, safety, B-BBEE, tax, quality, regulatory or operational audit and does not warrant ongoing compliance. The Verification Policy explains these limits.",
    ],
  },
  {
    title: "11. Intermediary, referral and commercial disclosures",
    paragraphs: [
      "WORKS's intermediary service is to receive or structure a production requirement, identify possible independent providers or related services, facilitate selected introductions and preserve the relevant platform record. The independent provider remains the supplier of its own goods or services.",
      "Oremea may receive a plan fee, introduction fee, referral fee, affiliate payment, commission, recurring commission, revenue share, sponsorship fee or other commercial benefit. Where compensation, a conflict of interest or another commercial relationship is relevant to a particular recommendation, introduction or placement, WORKS will disclose it clearly and in writing in time for the affected user to make an informed decision. Amounts are stated where reasonably determinable; otherwise the calculation basis is described.",
      "Where Consumer Protection Act intermediary rules apply, Oremea supplies the relevant consumer with any additional prescribed intermediary particulars required for that relationship in a durable written record. Sensitive identity particulars required for a particular consumer are supplied directly rather than published indiscriminately on an indexed public page.",
      "Where the Consumer Protection Act requires intermediary records, Oremea retains the applicable disclosure information, written consumer instructions and, where a transaction results and advice was given, the relevant advice record and basis for at least three years.",
    ],
  },
  {
    title: "12. Data and visibility",
    paragraphs: [
      "Public and private profile fields are controlled by WORKS settings and platform rules. Contact details, private briefs, capacity, demand targets, claim evidence and internal matching information are not made public merely because a business has a public profile.",
      "WORKS data is handled under Oremea's Privacy and POPIA Policy. A customer or provider must not use data obtained through WORKS for unauthorised marketing, scraping, surveillance, resale or another unrelated purpose.",
    ],
  },
  {
    title: "13. No circumvention or misuse",
    paragraphs: [
      "Users may not misuse WORKS to harvest data, fabricate demand, impersonate a business, falsify evidence, manipulate reviews, probe competitors, bypass security or expose confidential information.",
      "The parties remain free to contract directly after an introduction unless a separate written referral or commercial agreement lawfully provides otherwise.",
    ],
  },
  {
    title: "14. Suspension and removal",
    paragraphs: [
      "WORKS may pause a claim, profile, brief, review, response, plan or account where there is a reasonable basis to investigate fraud, false authority, serious inaccuracy, abuse, unlawful activity, account compromise, privacy exposure or a material policy breach.",
      "Where appropriate, an affected user may request review at support@oremea.com.",
    ],
  },
  {
    title: "15. Disputes and liability",
    paragraphs: [
      "Customers and providers should first address disputes under their direct agreement. Oremea may preserve relevant platform records or facilitate communication but is not required to decide the merits of an independent commercial dispute.",
      "To the extent permitted by law, Oremea is not responsible for indirect or consequential loss arising solely from an independent party's conduct, a customer-provider agreement or inaccurate information supplied by a user. Nothing excludes liability or consumer rights that applicable law does not permit Oremea to exclude.",
    ],
  },
  {
    title: "16. Law, supplier information and contact",
    paragraphs: [
      `These Terms are governed by South African law. Oremea is operated by ${OREMEA_OPERATOR.name}, ${OREMEA_OPERATOR.legalForm} trading as ${OREMEA_OPERATOR.tradingName}. Physical and legal-service address: ${OREMEA_OPERATOR.serviceAddress}. Website: ${OREMEA_OPERATOR.website}. Email: ${OREMEA_OPERATOR.email}. Telephone: ${OREMEA_OPERATOR.telephone}.`,
    ],
  },
];

export default function WorksTermsPage() {
  return (
    <LegalDocument
      activePath="/works/terms"
      title="WORKS Terms"
      summary="The specific rules for WORKS customers, provider profiles, matching, enquiries, plans, reviews and commercial introductions."
      updated="24 August 2026"
      sections={sections}
      returnLink={WORKS_RETURN_LINK}
      references={[
        { label: "Consumer Protection Act 68 of 2008", href: "https://www.gov.za/sites/default/files/32186_467.pdf" },
        { label: "Consumer Protection Regulations, 2011", href: "https://www.gov.za/sites/default/files/gcis_document/201409/34180rg9515gon293.pdf" },
        { label: "Electronic Communications and Transactions Act 25 of 2002", href: "https://www.gov.za/documents/electronic-communications-and-transactions-act" },
      ]}
    />
  );
}
