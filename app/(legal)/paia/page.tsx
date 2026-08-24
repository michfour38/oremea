import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { OREMEA_OPERATOR } from "@/src/lib/legal/legal-links";

const sections: readonly LegalSection[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      "This manual is prepared under section 51 of the Promotion of Access to Information Act 2 of 2000 (PAIA). It explains records held by Oremea and how a person may request access where PAIA grants that right.",
      `Oremea is operated by ${OREMEA_OPERATOR.name}, a ${OREMEA_OPERATOR.legalForm} trading as ${OREMEA_OPERATOR.tradingName}.`,
    ],
  },
  {
    title: "2. Contact and Information Officer",
    paragraphs: [
      `Head of the private body and Information Officer: ${OREMEA_OPERATOR.name}\nEmail: ${OREMEA_OPERATOR.email}\nTelephone: ${OREMEA_OPERATOR.telephone}\nPhysical business and legal-service address: ${OREMEA_OPERATOR.serviceAddress}.`,
      "PAIA requests and related correspondence may be sent to support@oremea.com with the subject line 'PAIA request'.",
    ],
  },
  {
    title: "3. Information Regulator guide",
    paragraphs: ["The Information Regulator publishes a guide explaining how PAIA works, the assistance available, remedies, applicable fees and the prescribed forms. The guide and forms are available from the Information Regulator's official website."],
  },
  {
    title: "4. Records available without a formal request",
    paragraphs: [
      "Public website pages, public legal policies, published product information, public WORKS provider profiles and published WORKS reviews are ordinarily available without a PAIA request, subject to availability and lawful restrictions.",
      "A data subject seeking access to their own personal information may also use the process described in the Privacy and POPIA Policy. Oremea may still require identity and authority verification.",
    ],
  },
  {
    title: "5. Categories of records",
    items: [
      "Business administration: operator records, policies, correspondence, contracts, supplier and service-provider records.",
      "Finance and tax: invoices, payment records, refunds, accounting records, tax and statutory records.",
      "People and contractors: agreements, payment records and other records required by applicable labour, tax or commercial law.",
      "Users and accounts: identity, contact, authentication, consent, support, purchase and account records.",
      "Oremea products: user inputs, saved progress, generated outputs, product access and service-operation records, subject to privacy, confidentiality and legal limitations.",
      "WORKS customers: searches, attribution, briefs, requirements, communications, provider outreach, responses, matches, introductions and reviews.",
      "WORKS providers: business profiles, claim and authority records, capabilities, capacity, visibility choices, credentials, plans, enquiries, responses, reviews and provider replies.",
      "Commercial and intermediary records: disclosures, written instructions, compensation or conflict records, referrals and any advice record required for an applicable intermediary transaction.",
      "Technology and security: access logs, audit records, incident records, configuration, intellectual property and system documentation.",
      "Legal and compliance: requests, complaints, disputes, legal advice, litigation and regulatory correspondence.",
    ],
  },
  {
    title: "6. Categories of data subjects and information",
    items: [
      "Customers and users: identity and contact data, account/authentication data, purchases, service inputs and outputs, support, consent and interaction records.",
      "WORKS customers: contact details, production requirements, briefs, searches, attribution, messages, introduction and review records.",
      "WORKS providers and business representatives: business identity, representative contact and authority data, profiles, capabilities, capacity, credentials, plan, response and review records.",
      "Suppliers, operators and contractors: contact, organisation, contract, billing and service-performance records.",
      "Complainants, requesters and correspondents: identity, contact, request, complaint, evidence and correspondence records.",
    ],
  },
  {
    title: "7. Purposes, recipients and cross-border processing",
    paragraphs: [
      "Oremea processes records to operate and secure accounts and products, deliver WORKS matching and introductions, process payments, communicate with users, comply with law, prevent misuse and resolve complaints or disputes.",
      "Depending on purpose and lawful authority, recipients may include Oremea operators and service providers for hosting, authentication, databases, AI, email, support, analytics and payment processing; an independent provider or customer involved in a requested WORKS introduction; professional advisers; regulators; courts; or law-enforcement bodies.",
      "Some technology operators may process or store information outside South Africa. Oremea applies the transfer safeguards described in its Privacy and POPIA Policy and POPIA section 72 where applicable.",
    ],
  },
  {
    title: "8. Security safeguards",
    paragraphs: [
      "Oremea uses reasonable technical and organisational measures appropriate to the records and risks. Measures may include managed authentication, role and access controls, encryption in transit, restricted administration, service-provider controls, logging, monitoring, backups and incident handling.",
      "Security measures reduce risk but cannot promise absolute security. Access requests remain subject to identity, authority, privacy, confidentiality and statutory refusal checks.",
    ],
  },
  {
    title: "9. Legislation under which records may be held",
    paragraphs: [
      "Depending on the activity and record, Oremea may retain records under PAIA, the Protection of Personal Information Act 4 of 2013, the Consumer Protection Act 68 of 2008 and its regulations, the Electronic Communications and Transactions Act 25 of 2002, tax legislation, intellectual-property legislation, prescription and evidence rules, and other laws applicable to a South African sole proprietor and online supplier.",
      "This list is not exhaustive and does not imply that every listed statute applies to every record.",
    ],
  },
  {
    title: "10. How to request access",
    paragraphs: [
      "A requester should complete the prescribed request for access to a record of a private body (Form 2), identify the requested record clearly, state the right being exercised or protected and explain why the record is required for that purpose.",
      "The request must include the requester's contact details, preferred form of access and enough proof of identity and authority for Oremea to protect records from unauthorised disclosure. A representative must provide proof of authority.",
    ],
  },
  {
    title: "11. Fees",
    paragraphs: [
      "Any request fee, access fee, reproduction charge, search-and-preparation charge or deposit permitted by PAIA and its regulations may be required before access is processed or provided. Oremea will communicate an applicable amount and payment method.",
      "A personal requester and any person exempt under applicable rules will not be charged a fee that the law does not permit.",
    ],
  },
  {
    title: "12. Decision and form of access",
    paragraphs: [
      "Oremea will consider a valid request and communicate a decision within the period required by PAIA, subject to a lawful extension. If access is granted, the response will identify the access method, applicable fee and any reasonable steps needed to protect another person's rights.",
      "Access may be provided by inspection, copy, transcript or another lawful form that is reasonably practicable for the record.",
    ],
  },
  {
    title: "13. Grounds for refusal and severance",
    paragraphs: [
      "PAIA permits or requires refusal in circumstances that include protection of another person's privacy, confidential commercial information, safety, legally privileged material, law-enforcement interests, research information and Oremea's own protected commercial information.",
      "A request may also be refused where the record does not exist, cannot be found after a reasonable search, the request is manifestly frivolous or vexatious, or another statutory ground applies. Where reasonably possible, a disclosable portion may be separated from protected material.",
    ],
  },
  {
    title: "14. Remedies",
    paragraphs: ["Oremea has no internal PAIA appeal procedure. A requester dissatisfied with a decision may use the remedies available under PAIA, including a complaint to the Information Regulator or an application to a court within the applicable period."],
  },
  {
    title: "15. Availability and updates",
    paragraphs: [
      `This manual is available without charge on Oremea's website. A physical copy is available through the Information Officer at ${OREMEA_OPERATOR.serviceAddress}; contact support@oremea.com to arrange access so private premises and other people's information remain protected.`,
      "Oremea will update the manual when material record categories, processing, contact details or legal requirements change.",
    ],
  },
];

export default function PaiaPage() {
  return (
    <LegalDocument
      activePath="/paia"
      title="PAIA Manual"
      summary="Oremea's section 51 manual for requests to access records under South Africa's Promotion of Access to Information Act."
      updated="24 August 2026"
      sections={sections}
      references={[
        { label: "Promotion of Access to Information Act 2 of 2000", href: "https://www.gov.za/documents/promotion-access-information-act" },
        { label: "Information Regulator PAIA guidance", href: "https://inforegulator.org.za/paia/" },
        { label: "Information Regulator private-body PAIA manual template", href: "https://inforegulator.org.za/wp-content/uploads/2020/07/PAIA-Manual-Template-Private-Body.pdf" },
      ]}
    />
  );
}
