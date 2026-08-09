import {
  LegalDocument,
  type LegalSection,
} from "@/components/legal/legal-document";

const sections: readonly LegalSection[] = [
  {
    title: "1. Purpose and scope",
    paragraphs: [
      "This Disclaimer explains the limits of Oremea's reflective products, artificial-intelligence-supported material and WORKS business services. It forms part of the Terms of Service.",
      "Oremea provides structured digital tools, information, matching and introductions. The platform does not replace the user's judgement, appropriate due diligence or qualified professional support.",
    ],
  },
  {
    title: "2. Reflective products",
    paragraphs: [
      "Recognition, Resonance and Compass help users reflect on information they choose to provide. Their questions, summaries and outputs are designed to support awareness and decision-making, not to establish objective facts about another person or determine what a user must do.",
      "A reflective output may feel personally relevant without being complete, independently verified or suitable for every context. Users remain responsible for evaluating it against their own circumstances.",
    ],
  },
  {
    title: "3. Artificial intelligence",
    paragraphs: [
      "Mirror and other features may use artificial intelligence to generate questions, summaries, interpretations or suggested language from available inputs.",
      "AI can misunderstand context, omit important information, reproduce bias, make incorrect inferences or produce confident-sounding errors. Oremea does not represent AI output as fact, diagnosis, evidence, professional advice or a reliable assessment of another person's motives, condition or intentions.",
    ],
  },
  {
    title: "4. Not medical, therapeutic or emergency care",
    paragraphs: [
      "Oremea is not a medical practice, psychotherapy service, psychiatric service, crisis line or emergency-response service. It does not diagnose, treat or prevent a physical or mental-health condition.",
      "If a user is in immediate danger, fears harm, is experiencing a medical or mental-health emergency, or needs urgent support, the user should stop using the platform and contact an appropriate emergency service, trusted human support or qualified professional.",
    ],
  },
  {
    title: "5. Not legal, financial or regulated advice",
    paragraphs: [
      "Oremea does not provide legal, tax, accounting, financial, investment, engineering, certification, compliance or other regulated professional advice. Users should obtain advice from an appropriately qualified person before acting where professional judgement is required.",
    ],
  },
  {
    title: "6. Emotional and relational material",
    paragraphs: [
      "Reflection may surface distressing, sensitive or emotionally intense material. Users may pause, stop or return later. A user who feels overwhelmed should seek appropriate human support.",
      "Oremea does not guarantee reconciliation, clarity, behaviour change, a particular relationship outcome or agreement between participants.",
    ],
  },
  {
    title: "7. Information supplied by users",
    paragraphs: [
      "Outputs and matches depend on the information available to the service. Incomplete, inaccurate, one-sided or outdated inputs can affect relevance and quality.",
      "Oremea does not independently investigate every statement, document, profile, review, credential, production brief or message submitted by a user or third party.",
    ],
  },
  {
    title: "8. WORKS discovery and matching",
    paragraphs: [
      "WORKS helps customers and independent providers discover possible commercial fit. A listing, search result, route, match, introduction, profile status, response or trust indicator is not a warranty, endorsement, regulated accreditation or guarantee of suitability, capacity, performance, payment or commercial outcome.",
      "Customers and providers remain responsible for their own checks, quotations, contracts, specifications, intellectual property, confidentiality, quality controls, insurance, payment arrangements, delivery and dispute resolution.",
    ],
  },
  {
    title: "9. Independent providers and external services",
    paragraphs: [
      "Unless Oremea expressly agrees otherwise in writing, providers found through WORKS and other linked services are independent from Oremea. Their statements, work, pricing, availability and conduct remain their own responsibility.",
      "A commercial referral, commission, affiliate relationship or sponsored placement will be disclosed where appropriate, but compensation does not convert an independent service into an Oremea service or guarantee its quality.",
    ],
  },
  {
    title: "10. Availability and results",
    paragraphs: [
      "Oremea does not guarantee uninterrupted access, error-free operation, permanent storage, a specific personal or business result, or a minimum number of leads, enquiries, customers, providers, contracts or revenue.",
      "Nothing in this Disclaimer excludes a mandatory right or liability that South African law does not allow Oremea to exclude.",
    ],
  },
  {
    title: "11. Questions",
    paragraphs: [
      "Questions about this Disclaimer may be sent to support@oremea.com.",
    ],
  },
];

export default function DisclaimerPage() {
  return (
    <LegalDocument
      activePath="/disclaimer"
      title="AI and Service Disclaimer"
      summary="Important limits for reflective outputs, AI-generated material, professional boundaries and WORKS business matching."
      updated="9 August 2026"
      sections={sections}
    />
  );
}
