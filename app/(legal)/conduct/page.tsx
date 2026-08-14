import {
  LegalDocument,
  type LegalSection,
} from "@/components/legal/legal-document";

const sections: readonly LegalSection[] = [
  {
    title: "1. Purpose",
    paragraphs: [
      "This Community and Acceptable Use Policy sets the minimum standards for using Oremea accounts, reflective products, WORKS profiles, production briefs, enquiries, messages, reviews and other platform features.",
      "It is intended to protect users, businesses, personal information, platform integrity and lawful participation.",
    ],
  },
  {
    title: "2. Honest and authorised use",
    items: [
      "Provide information that is materially accurate and not deliberately misleading.",
      "Use only accounts, business profiles, documents and information that you are authorised to access or submit.",
      "Do not impersonate another person, claim a business without authority or misrepresent qualifications, capacity, identity, experience, reviews or credentials.",
      "Correct material inaccuracies promptly when they come to your attention.",
    ],
  },
  {
    title: "3. Respect, consent and safety",
    items: [
      "Do not harass, threaten, intimidate, stalk, exploit or coerce another person.",
      "Do not publish hate speech or target a person on the basis of a protected characteristic.",
      "Respect confidentiality, consent, boundaries and another person's decision not to participate.",
      "Do not use Oremea to facilitate violence, abuse, unlawful discrimination, trafficking, sexual exploitation or other serious harm.",
    ],
  },
  {
    title: "4. Privacy and confidential information",
    paragraphs: [
      "Do not submit personal information, confidential business information, trade secrets, health information or another person's private communications unless you have a lawful basis and authority to do so.",
      "Do not scrape, harvest, re-identify, sell or use Oremea data, profiles, messages or contact details for unauthorised surveillance, spam or unrelated marketing.",
    ],
  },
  {
    title: "5. Platform and technical integrity",
    items: [
      "Do not introduce malware, probe security, bypass access controls or interfere with platform operation.",
      "Do not use automated access, extraction or bulk messaging without Oremea's written permission.",
      "Do not reverse engineer protected platform functions except where applicable law expressly permits it.",
      "Do not evade a suspension, usage limit, payment control or safety safeguard.",
    ],
  },
  {
    title: "6. WORKS customers and briefs",
    paragraphs: [
      "A customer must submit genuine enquiries and must not use a brief to gather confidential pricing, specifications or provider information for deceptive, anticompetitive or abusive purposes.",
      "Customers must communicate material requirements honestly and treat independent providers fairly. WORKS may limit repeated, speculative, abusive or bad-faith enquiries.",
    ],
  },
  {
    title: "7. WORKS providers and profiles",
    paragraphs: [
      "Providers must keep material identity, ownership, capability, capacity, location, availability, credential and contact information reasonably accurate. Paid participation does not permit a provider to buy verification, ranking, favourable reviews or a false trust indicator.",
      "A provider may not misuse customer briefs, disclose confidential requirements, divert contact information for unrelated marketing or represent an introduction as an Oremea endorsement.",
    ],
  },
  {
    title: "8. Reviews and public content",
    paragraphs: [
      "Reviews must reflect a genuine WORKS-linked interaction and the reviewer's honestly held experience. Fabricated, incentivised without disclosure, retaliatory, duplicate, extortionate, irrelevant or defamatory content is prohibited.",
      "Providers may respond professionally but may not pressure a reviewer to change an honest review or expose private customer information. The full Reviews Policy applies to WORKS reviews.",
    ],
  },
  {
    title: "9. Intellectual property",
    paragraphs: [
      "Do not upload or distribute material that infringes copyright, trade marks, privacy, confidentiality or other rights. Do not present another person's work, product, business or credential as your own.",
    ],
  },
  {
    title: "10. Enforcement",
    paragraphs: [
      "Depending on severity, context and risk, Oremea may request correction, restrict visibility, remove content, pause a profile or brief, limit features, suspend an account or terminate access.",
      "Oremea may act without advance notice where reasonably necessary to address fraud, account compromise, false credentials, malicious code, unlawful content, serious privacy exposure or an immediate safety or security risk.",
    ],
  },
  {
    title: "11. Reporting and review",
    paragraphs: [
      "Report suspected violations to support@oremea.com with the relevant page, account, profile, brief or review and enough context for Oremea to assess it. Do not send unnecessary sensitive information.",
      "A person affected by an enforcement decision may request a review at the same address. Oremea may preserve relevant records where reasonably required for security, legal compliance or dispute handling.",
    ],
  },
];

export default function ConductPage() {
  return (
    <LegalDocument
      activePath="/conduct"
      title="Community and Acceptable Use Policy"
      summary="The conduct, content, privacy and platform-integrity standards that apply across Oremea and WORKS."
      updated="9 August 2026"
      sections={sections}
    />
  );
}
