import type { Metadata } from "next";

import {
  LegalDocument,
  type LegalSection,
} from "@/components/legal/legal-document";
import { WORKS_RETURN_LINK } from "@/src/lib/legal/legal-links";
import { worksUrl } from "@/lib/works/seo";

export const metadata: Metadata = {
  title: "Terms for customers and providers | WORKS",
  description: "The rules for WORKS customer briefs, provider profiles, matching, enquiries, plans, reviews and commercial introductions.",
  alternates: { canonical: worksUrl("/terms") },
};

const sections: readonly LegalSection[] = [
  {
    title: "1. About WORKS",
    paragraphs: [
      "WORKS is an Oremea business-discovery, matching, lead-generation, introduction and referral service for customers and independent South African manufacturers, suppliers and business-service providers.",
      "These WORKS Terms supplement Oremea's Terms of Service. If they conflict on a WORKS-specific issue, these WORKS Terms apply to that issue. Mandatory South African rights remain unaffected.",
    ],
  },
  {
    title: "2. The parties",
    paragraphs: [
      "Oremea is operated by Michelle Fourie, a sole proprietor. A customer is a person or business searching, saving a search, submitting a brief, requesting sourcing or reviewing a provider. A provider is an independent business listed, claimed, managed or contacted through WORKS.",
      "Customers and providers usually contract directly with each other. Oremea is not a party to that underlying agreement unless Oremea expressly signs a separate written agreement saying otherwise.",
    ],
  },
  {
    title: "3. Searches, routes and matches",
    paragraphs: [
      "WORKS may use customer requirements, provider-supplied information, public information, account activity and current availability or capacity signals to identify possible routes and providers.",
      "A result, match, shortlist, introduction or enquiry indicates possible fit based on information available at the time. It is not a guarantee of suitability, acceptance, capacity, price, payment, performance, certification, delivery, revenue or a concluded contract.",
    ],
  },
  {
    title: "4. Customer responsibilities",
    items: [
      "Provide materially accurate requirements, timing, quantities, constraints and contact information.",
      "Have authority to submit the brief and any confidential, personal or intellectual-property material it contains.",
      "Evaluate providers independently and agree scope, price, deposit, payment, quality, inspection, delivery, confidentiality and ownership terms directly.",
      "Do not submit speculative, deceptive, abusive or unlawful enquiries or use provider information for unrelated marketing.",
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
      "A free or paid plan may affect profile tools, opportunity routing, selected demand features, capacity tools, insights, visibility controls or other functions described on the current plan page.",
      "Paid participation does not buy credentials, verification, favourable reviews, a guaranteed ranking, exclusivity, a minimum number of enquiries, filled capacity, contracts or revenue.",
      "Prices, billing periods, renewal and cancellation terms shown before purchase form part of these Terms and Oremea's Payments, Subscriptions, Cancellation and Refund Policy.",
    ],
  },
  {
    title: "8. Enquiries, responses and communications",
    paragraphs: [
      "WORKS may send a production brief or selected brief information to a possible provider and record whether that provider can help, needs more information or is outside capability.",
      "A provider must treat non-public brief information as confidential and use it only to assess or pursue the relevant opportunity. Customers must treat non-public provider responses, proposals and pricing on the agreed confidential basis.",
      "WORKS may facilitate communication but does not guarantee delivery, response time, authenticity of every message or successful negotiation.",
    ],
  },
  {
    title: "9. Reviews",
    paragraphs: [
      "A WORKS review may open after a provider has responded to a WORKS-linked brief. A 'Verified WORKS brief' indicator means the review is linked in Oremea's records to that interaction; it does not verify every factual statement or the quality of the underlying work.",
      "Reviews and provider responses are governed by the WORKS Reviews Policy. Oremea may moderate, restrict or remove content under that policy and the Community and Acceptable Use Policy.",
    ],
  },
  {
    title: "10. Verification and credentials",
    paragraphs: [
      "WORKS may display narrowly described checks or trust indicators. Each indicator confirms only the fact stated and the evidence reviewed at the time.",
      "Unless expressly identified, WORKS does not perform a legal, financial, technical, safety, B-BBEE, tax, quality, regulatory or operational audit and does not warrant ongoing compliance. The Verification Policy explains these limits.",
    ],
  },
  {
    title: "11. Referrals, commissions and sponsored positions",
    paragraphs: [
      "Oremea may earn an introduction fee, referral fee, affiliate payment, commission, recurring commission, revenue share or sponsored-placement revenue from an independent service or provider.",
      "The commercial nature of a relationship will be disclosed where relevant. Compensation does not guarantee fit, availability, acceptance, performance or preferential treatment and does not make the independent supplier part of Oremea.",
      "The Partner Disclosure describes how WORKS communicates these relationships.",
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
    title: "16. Law and contact",
    paragraphs: [
      "These Terms are governed by South African law. Questions may be sent to support@oremea.com or directed by telephone to 061 537 5188.",
    ],
  },
];

export default function WorksTermsPage() {
  return (
    <LegalDocument
      activePath="/works/terms"
      title="WORKS Terms"
      summary="The specific rules for WORKS customers, provider profiles, matching, enquiries, plans, reviews and commercial introductions."
      updated="9 August 2026"
      sections={sections}
      returnLink={WORKS_RETURN_LINK}
    />
  );
}
