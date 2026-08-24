import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { OREMEA_OPERATOR } from "@/src/lib/legal/legal-links";

const sections: readonly LegalSection[] = [
  {
    title: "1. About these Terms",
    paragraphs: [
      "These Terms govern access to and use of Oremea, www.oremea.com, Oremea accounts, and the products and services made available through the platform.",
      "They apply to Recognition, Resonance, Compass, Mirror and other AI-supported features, WORKS, paid access, subscriptions, messages, reviews, referrals and related platform functions.",
      "These Terms should be read with the Privacy and POPIA Policy, Payments, Subscriptions, Cancellation and Refund Policy, AI and Service Disclaimer, Community and Acceptable Use Policy, Cookie Policy, PAIA Manual and any product-specific terms shown before use or purchase.",
    ],
  },
  {
    title: "2. Operator and supplier information",
    paragraphs: [
      `Oremea is operated by ${OREMEA_OPERATOR.name}, a ${OREMEA_OPERATOR.legalForm} trading as ${OREMEA_OPERATOR.tradingName}.`,
      `Website: ${OREMEA_OPERATOR.website}\nEmail: ${OREMEA_OPERATOR.email}\nTelephone: ${OREMEA_OPERATOR.telephone}\nPhysical business address: ${OREMEA_OPERATOR.address}.\nAddress for legal service: ${OREMEA_OPERATOR.serviceAddress}.`,
    ],
  },
  {
    title: "3. Acceptance and authority",
    paragraphs: [
      "By creating an account, purchasing access, submitting information or using an Oremea service, you agree to these Terms and the policies incorporated into them.",
      "Where Oremea asks you to accept a document or consent separately, that acceptance or consent forms part of your agreement with Oremea.",
      "If you act for a business or another legal entity, you confirm that you have authority to bind that entity.",
    ],
  },
  {
    title: "4. Eligibility and accounts",
    paragraphs: [
      "You must be at least 18 years old and have legal capacity to create an account or use Oremea unless a specific product expressly provides a lawful, guardian-supported minor pathway.",
      "You must provide accurate account information, protect your sign-in credentials and notify support@oremea.com promptly if you suspect unauthorised access.",
      "Accounts may not be sold, transferred, shared deceptively or used to impersonate another person or business.",
    ],
  },
  {
    title: "5. Oremea services",
    paragraphs: [
      "Recognition provides an ongoing private recursive accountability conversation grounded in the participant's own words. Resonance provides contained seven-day reflection, while Compass provides structured direction, Map and movement tools. Mirror and other AI-supported features generate material in response to information supplied through the platform.",
      "WORKS provides business discovery, production routing, matching, lead-generation, introduction and referral services for customers, manufacturers, suppliers and independent business-service providers.",
      "Product descriptions, included features, access periods and prices are presented on the relevant product, plan or checkout page.",
    ],
  },
  {
    title: "6. Reflective products and AI-supported material",
    paragraphs: [
      "Oremea's reflective products help users examine and articulate their own experiences, patterns, choices and possible directions. They do not establish objective truth about another person, determine legal responsibility or make decisions for the user.",
      "Artificial intelligence may generate questions, summaries, interpretations and other responses from the information available to it. AI output may be inaccurate, incomplete, unsuitable, inconsistent or based on missing context. Fluency or confidence does not establish accuracy.",
      "AI output must not be presented as a professional diagnosis, independently verified evidence, legal finding or authoritative statement about another person's motives or condition.",
    ],
  },
  {
    title: "7. Professional and emergency services",
    paragraphs: [
      "Oremea supplies reflective tools and digital platform services. Medical care, psychotherapy, psychiatric treatment, legal advice, financial advice, tax advice, accounting advice, regulated verification and emergency response remain with appropriately qualified providers.",
      "Oremea is not continuously monitored by a human and is not an emergency-reporting channel. A person facing immediate danger or a medical or safety emergency should contact an appropriate emergency service or qualified human support.",
    ],
  },
  {
    title: "8. WORKS matching and introductions",
    paragraphs: [
      "WORKS may help users discover, compare and contact manufacturers, suppliers, production providers, logistics providers and independent business-support services.",
      "WORKS may receive customer requirements, create or maintain provider profiles, identify possible matches, route enquiries, facilitate contact, display reviews and evidence states, and support commercial introductions.",
      "A match or qualified lead indicates possible alignment based on available information. It does not guarantee acceptance, approval, capacity, performance, payment, certification, revenue or a concluded contract. Commercial payment to Oremea does not convert a possible fit into a stronger suitability or evidence match.",
    ],
  },
  {
    title: "9. Independent customer-provider agreements",
    paragraphs: [
      "Customers and providers ordinarily contract directly with one another.",
      "Unless expressly agreed in writing, Oremea does not manufacture goods, supply the provider's underlying service, supervise production, approve quotations, hold transaction funds, insure a transaction, process provider invoices, audit a business, issue certificates or perform regulated verification.",
      "Customers and providers are responsible for their own due diligence, specifications, quotations, prices, deposits, payment terms, intellectual property, confidentiality, quality, inspection, delivery, insurance, warranties and disputes.",
    ],
  },
  {
    title: "10. Provider information and trust indicators",
    paragraphs: [
      "Provider information may be supplied by the provider, an authorised representative, customers, public sources or Oremea's research. An unclaimed listing does not mean that the business has subscribed to, endorsed or entered into a commercial partnership with Oremea.",
      "A person claiming or managing a provider profile must have authority to represent that business and must keep material capability, capacity, location, contact and credential information reasonably accurate and current.",
      "A credential, document review or trust indicator confirms only the specific current fact described by that indicator. It is not a complete legal, financial, technical, regulatory or operational audit of the provider.",
    ],
  },
  {
    title: "11. Referrals, intermediary services and commercial relationships",
    paragraphs: [
      "Oremea may connect users with independent business services and may receive a plan fee, referral fee, introduction fee, commission, recurring commission, revenue share, affiliate payment or sponsored-placement revenue.",
      "Where compensation, sponsorship or a conflict is relevant to a particular WORKS recommendation, introduction or placement, Oremea will disclose the commercial relationship clearly and in writing in time for the affected user to make an informed decision. Where reasonably determinable, the amount is stated; otherwise the calculation basis is described.",
      "Where Consumer Protection Act intermediary rules apply, Oremea provides the affected consumer with the prescribed intermediary information applicable to that relationship and retains the prescribed records for at least three years. Sensitive identity particulars required for a specific consumer are provided directly rather than published indiscriminately.",
      "Oremea will not publicly describe a business as formal, exclusive, approved or preferred unless that relationship has been agreed and can be substantiated.",
    ],
  },
  {
    title: "12. Information and material you submit",
    paragraphs: [
      "You remain responsible for information, documents, instructions, reflections, reviews, production briefs, messages and other material you submit.",
      "You confirm that you have the necessary rights and authority to submit the material and that its use for the selected service is lawful.",
      "You must not submit information you know to be false, fraudulent, unlawfully obtained, misleading or outside your authority to disclose.",
    ],
  },
  {
    title: "13. Prices, payment and access",
    paragraphs: [
      "The applicable product, price, currency, payment frequency and material charges will be displayed before payment is confirmed. Payments are processed through the independent processor, marketplace or subscription provider identified at checkout.",
      "A once-off purchase provides the access described at checkout and does not create a recurring subscription unless the checkout clearly states otherwise.",
      "Access may begin immediately after successful payment, when an access link is issued or on another date displayed before purchase. Purchasing access does not guarantee a personal, relational, therapeutic, commercial or financial outcome.",
    ],
  },
  {
    title: "14. Subscriptions, cancellation and refunds",
    paragraphs: [
      "A recurring subscription renews for the displayed billing period until cancelled, unless the checkout states another arrangement. Before subscribing, the recurring price, billing frequency, included features and available cancellation method will be displayed.",
      "For WORKS monthly provider plans, cancellation stops future renewal. Paid plan access ordinarily continues through the end of the current paid billing period and then returns to Free, unless a refund, reversal, failed payment or mandatory law requires another result.",
      "Cancellation, cooling-off rights, failed supply, refunds and billing disputes are governed by the Payments, Subscriptions, Cancellation and Refund Policy and applicable South African law. Nothing removes a statutory cancellation, cooling-off, refund or consumer remedy that cannot lawfully be excluded.",
    ],
  },
  {
    title: "15. Electronic communications and marketing",
    paragraphs: [
      "Oremea may communicate electronically about accounts, purchases, security, subscriptions, requested opportunities, referrals, support and changes to the service.",
      "Oremea may maintain electronic records of transactions, accepted terms, profile changes, communications, claims, reviews, referrals and account activity.",
      "Marketing communications are subject to applicable consent and opt-out requirements, including POPIA requirements for unsolicited electronic direct marketing.",
    ],
  },
  {
    title: "16. Acceptable use, reviews and communications",
    paragraphs: [
      "You must use Oremea lawfully, honestly and in accordance with the Community and Acceptable Use Policy.",
      "Prohibited conduct includes fraud, impersonation, harassment, threats, unlawful discrimination, privacy violations, malware, unauthorised access, scraping, spam, fabricated reviews, false credentials, intellectual-property infringement and bypassing access, payment, security or moderation controls.",
      "Reviews must reflect genuine eligible interactions and honest experience and comply with the WORKS Reviews Policy. Contact information received for a specific enquiry may be used to assess and respond to that enquiry, but may not automatically be added to unrelated bulk-marketing databases without a lawful basis.",
    ],
  },
  {
    title: "17. Privacy",
    paragraphs: [
      "Oremea processes personal information according to the Privacy and POPIA Policy and applicable data-protection law.",
      "Private reflective content does not automatically become visible to other users, WORKS customers, WORKS providers or the public.",
      "Where a user requests an independent referral or introduction, Oremea may share information reasonably necessary for that purpose after the recipient and purpose are identified or made reasonably apparent.",
    ],
  },
  {
    title: "18. Intellectual property and confidentiality",
    paragraphs: [
      "Oremea and its licensors retain rights in the platform, software, source code, designs, branding, frameworks, questions, prompts and other materials created by or for Oremea. You receive a limited, personal, revocable, non-exclusive and non-transferable right to use the applicable service for its intended purpose.",
      "You retain ownership of material you lawfully submit and grant Oremea a limited licence to host, store, process, reproduce and transmit it as reasonably necessary to operate, secure and improve the requested service, comply with law and enforce these Terms.",
      "Platform controls do not automatically create a non-disclosure agreement between customers and providers. Users should enter a suitable confidentiality agreement before sharing trade secrets, unreleased designs or commercially sensitive material where required.",
    ],
  },
  {
    title: "19. Third-party services, availability and changes",
    paragraphs: [
      "Oremea relies on independent providers for functions such as authentication, hosting, databases, AI processing, email delivery, payment processing and referrals. Those providers may have their own terms and privacy notices.",
      "Oremea may change, improve, restrict, replace or discontinue features as the platform develops. Access may occasionally be interrupted by maintenance, software errors, hosting problems, security measures, third-party outages or events beyond reasonable control.",
      "A link, integration, listing or introduction does not by itself constitute a guarantee, accreditation or endorsement.",
    ],
  },
  {
    title: "20. Suspension and termination",
    paragraphs: [
      "Oremea may warn, restrict, suspend or terminate an account, profile, brief, review or feature where there is a reasonable basis to believe that these Terms, another applicable policy or the law has been materially breached.",
      "Oremea may act without prior notice where reasonably necessary to address fraud, account compromise, malicious code, false credentials, serious privacy exposure, unlawful content or a material safety or security risk.",
      "Where appropriate, a user may request review by contacting support@oremea.com.",
    ],
  },
  {
    title: "21. Disclaimers, liability and mandatory rights",
    paragraphs: [
      "Oremea provides digital tools, platform access, matching and introductions. Oremea does not guarantee uninterrupted access, error-free AI output, personal transformation, provider performance, customer payment, commercial success, certification, regulatory approval or a specific number of leads or contracts.",
      "To the extent permitted by law, Oremea is not responsible for indirect or consequential loss arising solely from another user's conduct, an independent provider, a customer-provider agreement, inaccurate information supplied by another party or a commercial decision made by the user.",
      "Nothing in these Terms excludes liability for intentional wrongdoing, gross negligence or another liability or consumer right that applicable law does not permit Oremea to exclude or limit.",
    ],
  },
  {
    title: "22. Governing law, changes and contact",
    paragraphs: [
      "These Terms are governed by the laws of the Republic of South Africa. Where applicable consumer law grants access to a tribunal, ombud, commission or court, that right remains. Otherwise, disputes may be heard by a court with jurisdiction in South Africa.",
      "Oremea may update these Terms when services, laws, commercial arrangements or the legal operator change. Material changes will be communicated reasonably, and renewed acceptance will be requested where required.",
      `Questions may be sent to ${OREMEA_OPERATOR.email} or directed by telephone to ${OREMEA_OPERATOR.telephone}. Physical and legal-service address: ${OREMEA_OPERATOR.serviceAddress}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      activePath="/terms"
      title="Terms of Service"
      summary="The terms governing Oremea's reflective products, AI-supported features, accounts, payments and WORKS business services."
      updated="24 August 2026"
      sections={sections}
      references={[
        { label: "Consumer Protection Act 68 of 2008", href: "https://www.gov.za/sites/default/files/32186_467.pdf" },
        { label: "Electronic Communications and Transactions Act 25 of 2002", href: "https://www.gov.za/documents/electronic-communications-and-transactions-act" },
      ]}
    />
  );
}
