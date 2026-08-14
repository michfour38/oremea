import {
  LegalDocument,
  type LegalSection,
} from "@/components/legal/legal-document";

const sections: readonly LegalSection[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      "This manual is prepared under section 51 of the Promotion of Access to Information Act 2 of 2000 (PAIA). It explains records held by Oremea and how a person may request access where PAIA grants that right.",
      "Oremea is operated by Michelle Fourie, a sole proprietor trading as Oremea.",
    ],
  },
  {
    title: "2. Contact and Information Officer",
    paragraphs: [
      "Head of the private body and Information Officer: Michelle Fourie\nEmail: support@oremea.com\nTelephone: 061 537 5188\nBusiness location: South Africa.\nAddress for formal service: available through support@oremea.com on a valid request.",
      "PAIA requests and related correspondence may be sent to support@oremea.com with the subject line 'PAIA request'.",
    ],
  },
  {
    title: "3. Information Regulator guide",
    paragraphs: [
      "The Information Regulator publishes a guide explaining how PAIA works, the assistance available, remedies, applicable fees and the prescribed forms. The guide and forms are available from the Information Regulator's official website.",
    ],
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
      "WORKS customers: searches, briefs, requirements, communications, provider outreach, responses, matches and reviews.",
      "WORKS providers: business profiles, claim and authority records, capabilities, capacity, visibility choices, credentials, plans, enquiries, responses, reviews and provider replies.",
      "Technology and security: access logs, audit records, incident records, configuration, intellectual property and system documentation.",
      "Legal and compliance: requests, complaints, disputes, legal advice, litigation and regulatory correspondence.",
    ],
  },
  {
    title: "6. Legislation under which records may be held",
    paragraphs: [
      "Depending on the activity and record, Oremea may retain records under PAIA, the Protection of Personal Information Act 4 of 2013, the Consumer Protection Act 68 of 2008, the Electronic Communications and Transactions Act 25 of 2002, tax legislation, intellectual-property legislation, prescription and evidence rules, and other laws applicable to a South African sole proprietor and online supplier.",
      "This list is not exhaustive and does not imply that every listed statute applies to every record.",
    ],
  },
  {
    title: "7. How to request access",
    paragraphs: [
      "A requester should complete the prescribed request for access to a record of a private body (Form 2), identify the requested record clearly, state the right being exercised or protected and explain why the record is required for that purpose.",
      "The request must include the requester's contact details, preferred form of access and enough proof of identity and authority for Oremea to protect records from unauthorised disclosure. A representative must provide proof of authority.",
    ],
  },
  {
    title: "8. Fees",
    paragraphs: [
      "Any request fee, access fee, reproduction charge, search-and-preparation charge or deposit permitted by PAIA and its regulations may be required before access is processed or provided. Oremea will communicate an applicable amount and payment method.",
      "A personal requester and any person exempt under applicable rules will not be charged a fee that the law does not permit.",
    ],
  },
  {
    title: "9. Decision and form of access",
    paragraphs: [
      "Oremea will consider a valid request and communicate a decision within the period required by PAIA, subject to a lawful extension. If access is granted, the response will identify the access method, applicable fee and any reasonable steps needed to protect another person's rights.",
      "Access may be provided by inspection, copy, transcript or another lawful form that is reasonably practicable for the record.",
    ],
  },
  {
    title: "10. Grounds for refusal and severance",
    paragraphs: [
      "PAIA permits or requires refusal in circumstances that include protection of another person's privacy, confidential commercial information, safety, legally privileged material, law-enforcement interests, research information and Oremea's own protected commercial information.",
      "A request may also be refused where the record does not exist, cannot be found after a reasonable search, the request is manifestly frivolous or vexatious, or another statutory ground applies. Where reasonably possible, a disclosable portion may be separated from protected material.",
    ],
  },
  {
    title: "11. Remedies",
    paragraphs: [
      "Oremea has no internal PAIA appeal procedure. A requester dissatisfied with a decision may use the remedies available under PAIA, including a complaint to the Information Regulator or an application to a court within the applicable period.",
    ],
  },
  {
    title: "12. Availability and updates",
    paragraphs: [
      "This manual is available without charge on Oremea's website and from the Information Officer on request. Oremea will update it when material record categories, contact details or legal requirements change.",
    ],
  },
];

export default function PaiaPage() {
  return (
    <LegalDocument
      activePath="/paia"
      title="PAIA Manual"
      summary="Oremea's section 51 manual for requests to access records under South Africa's Promotion of Access to Information Act."
      updated="9 August 2026"
      sections={sections}
      references={[
        {
          label: "Promotion of Access to Information Act 2 of 2000",
          href: "https://www.gov.za/documents/promotion-access-information-act",
        },
        {
          label: "Information Regulator PAIA guidance",
          href: "https://inforegulator.org.za/paia/",
        },
        {
          label: "Information Regulator PAIA forms",
          href: "https://inforegulator.org.za/paia-forms/",
        },
      ]}
    />
  );
}
