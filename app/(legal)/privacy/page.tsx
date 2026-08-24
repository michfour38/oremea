import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { OREMEA_OPERATOR } from "@/src/lib/legal/legal-links";

const sections: readonly LegalSection[] = [
  {
    title: "1. Scope and responsible party",
    paragraphs: [
      "This Privacy and POPIA Policy explains how Oremea collects, uses, stores, shares and protects personal information across www.oremea.com, Oremea accounts, Recognition, Resonance, Compass, Mirror, WORKS and related services.",
      `Michelle Fourie, a sole proprietor trading as Oremea, is the responsible party for personal information processed for Oremea's own purposes. Physical and legal-service address: ${OREMEA_OPERATOR.serviceAddress}. Independent providers introduced through WORKS are ordinarily separate responsible parties for information they receive and use for their own services.`,
    ],
  },
  {
    title: "2. Information Oremea processes",
    items: [
      "Account and identity information, including name, email address, authentication identifiers and contact details.",
      "Purchase, entitlement, billing-status and transaction-reference information. Complete payment-card details are handled by the processor identified at checkout rather than intentionally stored by Oremea.",
      "Private reflective content, including Recognition conversation messages and participant-controlled remembered excerpts, Resonance responses and Mirrors, Compass discussion, Map and participant-created goals, archives, preferences and feedback.",
      "WORKS customer requirements, briefs, searches, messages, contact details, provider profiles, capabilities, capacity, locations, credentials, claims, reviews, responses and introduction records.",
      "Technical and usage information, including device, browser, IP address, session, security, error, diagnostic and interaction data reasonably required to operate and protect the platform.",
      "First-touch acquisition information for WORKS, such as the landing path, referring website or domain and campaign tags including source, medium, campaign, term and content where those values are supplied to the site.",
      "Support, consent, communication, complaint, legal and compliance records.",
    ],
  },
  {
    title: "3. Sensitive and third-party information",
    paragraphs: [
      "Reflective responses and conversations may contain private, sensitive or special personal information because users choose what to write. Oremea processes that material to supply the requested reflective experience and applies the same private-by-default principle to it.",
      "Users should share another person's personal or special personal information only where they have authority, a lawful basis and a genuine need to do so. Access to a person's story does not create permission to publish, distribute or repurpose it.",
    ],
  },
  {
    title: "4. Sources of information",
    paragraphs: [
      "Oremea receives information directly from users, their authorised representatives, connected account and payment services, requested referrals, interactions on the platform and communications with support.",
      "WORKS provider information may also come from an authorised business representative, a customer, a public business source or Oremea's own research. The source and claim status may affect how the information is displayed and whether it is treated as confirmed.",
      "WORKS acquisition attribution may be derived from the page on which a visitor first arrives, the referring host supplied by the browser and campaign parameters included in a marketing link. Oremea does not need the complete referring URL where the referring host is sufficient for attribution.",
    ],
  },
  {
    title: "5. Purposes and lawful processing",
    items: [
      "Create and secure accounts, authenticate users and maintain access.",
      "Deliver purchased or requested products, generate requested reflective responses, preserve ongoing conversations and archives where the product provides them, and maintain participant-selected memory or progress controls.",
      "Receive WORKS requirements, create provider records, identify possible matches, route enquiries and facilitate requested introductions.",
      "Attribute WORKS enquiries to their first known acquisition source, understand which landing pages or campaigns create useful demand and avoid losing the source of a captured lead.",
      "Process payment confirmations, subscriptions, cancellations, refunds and support requests.",
      "Communicate about accounts, security, purchases, requested opportunities, service changes and consented marketing.",
      "Prevent fraud, misuse and security incidents; enforce terms; meet legal obligations; establish or defend legal rights.",
      "Measure reliability, diagnose errors and improve the safety, clarity and usefulness of Oremea services.",
    ],
    paragraphs: [
      "Depending on the context, processing is based on consent, performance of an agreement, compliance with law, protection of a legitimate interest, a legitimate interest of Oremea or a third party, or another basis permitted by POPIA.",
    ],
  },
  {
    title: "6. AI processing",
    paragraphs: [
      "Oremea uses AI service providers to process selected user inputs and generate questions, reflections, summaries, distinctions and other requested responses. The information sent is limited to what is reasonably required for the feature being used.",
      "In Recognition, recent conversation context and relevant participant-written excerpts may be supplied to the AI so the conversation can remain continuous over time. Long-term remembered excerpts are drawn from the participant's own words and are made available for the participant to inspect and remove.",
      "AI-supported outputs may be stored with the account so the user can continue or review the work. Oremea uses contractual, technical and organisational measures appropriate to the service and does not treat AI output as independently verified fact.",
    ],
  },
  {
    title: "7. WORKS visibility and introductions",
    paragraphs: [
      "A WORKS provider profile may include information intended for public business discovery and information held privately for matching, operations or verification. Visibility settings and claim status determine what is displayed.",
      "Where a user requests an introduction, Oremea may share the contact, requirement, capability or other information reasonably necessary to make that introduction after the purpose and recipient are identified or made reasonably apparent. Phone details are not shared merely because they exist when the user has chosen email as the preferred route.",
      "Information shared with an independent customer or provider is then also processed under that party's own privacy responsibilities.",
    ],
  },
  {
    title: "8. Recipients and operators",
    paragraphs: [
      "Oremea may use independent operators and service providers for authentication, hosting, databases, security, analytics, AI processing, email delivery, customer support and payment processing. They receive information only for the relevant function and under applicable contractual or legal duties.",
      "Information may also be disclosed to a requested referral recipient, professional adviser, regulator, court, law-enforcement authority, purchaser of the business subject to lawful safeguards, or another recipient where disclosure is authorised or legally required.",
      "Oremea does not sell private reflective content or personal information as a standalone data product.",
    ],
  },
  {
    title: "9. Cross-border processing",
    paragraphs: [
      "Some technology providers may process or store information outside South Africa. Oremea uses providers and safeguards intended to support a level of protection consistent with POPIA section 72, including appropriate contracts, binding rules, consent or another lawful transfer basis where applicable.",
    ],
  },
  {
    title: "10. Security",
    paragraphs: [
      "Oremea applies reasonable technical and organisational safeguards designed for the nature of the information and the reasonably foreseeable risks. Measures may include managed authentication, access controls, encryption in transit, service-provider controls, backups, logging, monitoring and restricted administrative access.",
      "No online system can promise absolute security. Users support account security by protecting sign-in methods, using current devices and reporting suspected unauthorised access promptly.",
    ],
  },
  {
    title: "11. Retention and deletion",
    paragraphs: [
      "Oremea keeps information for as long as reasonably required to supply the service, maintain the user's requested record, meet legal and tax obligations, resolve disputes, prevent fraud and enforce agreements.",
      "Where Consumer Protection Act intermediary record-keeping rules apply, Oremea retains the applicable intermediary disclosure information, written consumer instructions and, where a transaction results and advice was furnished, the relevant advice record and basis for at least three years.",
      "Where a product provides direct controls, the user may remove product-held memory or delete the applicable private conversation without cancelling the underlying account or requiring deletion of transaction, legal, security or billing records that must be retained separately.",
      "Retention periods vary by record type. Information is deleted, de-identified or securely archived when its purpose and applicable retention duties have ended. Backup copies may remain for a limited cycle before deletion.",
      "A deletion request may be limited where Oremea must retain a transaction, legal, security or dispute record or where another lawful ground applies.",
    ],
  },
  {
    title: "12. Automated processing and decisions",
    paragraphs: [
      "Oremea may use automated processing to generate reflective material, rank possible WORKS matches, identify safety or misuse signals and support platform operations.",
      "Reflective outputs and match rankings support human participation; they do not make a binding legal, employment, credit, insurance or regulatory decision about a person. A user may contact support@oremea.com to question a materially significant automated outcome.",
    ],
  },
  {
    title: "13. Cookies and direct marketing",
    paragraphs: [
      "Cookies and similar technologies are governed by the Cookie Policy. Essential technologies support sign-in, security, preferences and service continuity. Non-essential analytics or marketing technologies are used subject to applicable notice and consent requirements.",
      "Electronic direct marketing is sent only where Oremea has a lawful basis under POPIA, including consent or the permitted existing-customer pathway. Each marketing message provides a practical way to opt out.",
    ],
  },
  {
    title: "14. Your rights",
    items: [
      "Ask whether Oremea holds personal information about you and request access to it.",
      "Request correction, completion, updating, deletion or destruction where the legal requirements are met.",
      "Object to processing in circumstances recognised by POPIA.",
      "Withdraw consent where processing relies on consent, without affecting prior lawful processing.",
      "Opt out of direct marketing.",
      "Lodge a complaint with the Information Regulator or pursue another remedy available under law.",
    ],
  },
  {
    title: "15. Exercising rights and identity checks",
    paragraphs: [
      "Send privacy requests to support@oremea.com with the subject 'Privacy request'. Include enough detail to identify the account, information and request.",
      "Oremea may request proportionate proof of identity or authority before releasing, changing or deleting information. Access to records under PAIA follows the process in the Oremea PAIA Manual.",
    ],
  },
  {
    title: "16. Children",
    paragraphs: [
      "General Oremea accounts and WORKS services are designed for adults. Oremea does not knowingly open a general account for a child without a specific lawful pathway, appropriate guardian authority and safeguards suited to that service.",
      "A guardian who believes a child supplied information outside an authorised pathway may contact support@oremea.com.",
    ],
  },
  {
    title: "17. Security compromises",
    paragraphs: [
      "Where Oremea has reasonable grounds to believe that personal information has been accessed or acquired by an unauthorised person, Oremea will investigate, contain the incident and notify the Information Regulator and affected data subjects where POPIA requires it, subject to any lawful delay.",
    ],
  },
  {
    title: "18. Information Officer, complaints and changes",
    paragraphs: [
      `Information Officer and responsible party contact: ${OREMEA_OPERATOR.name}, ${OREMEA_OPERATOR.email}, ${OREMEA_OPERATOR.telephone}, ${OREMEA_OPERATOR.serviceAddress}.`,
      "Privacy complaints may also be submitted to the Information Regulator through its official complaints process. Oremea may update this policy when services, providers or legal requirements change. Material changes will be communicated reasonably and renewed consent obtained where required.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      activePath="/privacy"
      title="Privacy & POPIA Policy"
      summary="How personal information, private reflections, WORKS business data and acquisition attribution move through Oremea—and the choices and rights attached to them."
      updated="24 August 2026"
      sections={sections}
      references={[
        { label: "Protection of Personal Information Act 4 of 2013", href: "https://www.gov.za/documents/protection-personal-information-act" },
        { label: "Information Regulator complaints", href: "https://inforegulator.org.za/complaints/" },
      ]}
    />
  );
}
