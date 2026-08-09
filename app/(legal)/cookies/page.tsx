import {
  LegalDocument,
  type LegalSection,
} from "@/components/legal/legal-document";

const sections: readonly LegalSection[] = [
  {
    title: "1. What this policy covers",
    paragraphs: [
      "This Cookie Policy explains how Oremea uses cookies and similar browser technologies on www.oremea.com and its product and WORKS pages. It should be read with the Privacy and POPIA Policy.",
    ],
  },
  {
    title: "2. What cookies are",
    paragraphs: [
      "Cookies are small data files stored by a browser. Similar technologies include local storage and identifiers used to maintain a session, protect an account, remember a choice or understand whether a service is functioning.",
    ],
  },
  {
    title: "3. Essential technologies",
    paragraphs: [
      "Oremea uses technologies that are necessary to deliver requested services, maintain sign-in and account state, protect sessions, prevent abuse, route a user through a product flow, remember privacy or interface choices and preserve service continuity.",
      "Disabling essential storage may prevent sign-in, saved progress, checkout, WORKS account features or other requested functions from working correctly.",
    ],
  },
  {
    title: "4. Authentication providers",
    paragraphs: [
      "Oremea may use an authentication provider to create and protect account sessions. That provider may set cookies required for sign-in, fraud prevention, security and account continuity under its own documented controls.",
    ],
  },
  {
    title: "5. Analytics and performance",
    paragraphs: [
      "Oremea may use limited analytics or performance technologies to understand service reliability and aggregated usage. Where a technology is not necessary for a requested service, Oremea will provide applicable notice and obtain consent where required before activating it.",
      "Oremea does not describe an essential authentication or security cookie as an advertising cookie merely because it is supplied by an independent operator.",
    ],
  },
  {
    title: "6. Advertising and marketing",
    paragraphs: [
      "Oremea does not authorise a non-essential advertising or cross-site marketing technology through this policy alone. If such technology is introduced, the user-facing notice and consent controls will be updated before use where required.",
    ],
  },
  {
    title: "7. Duration",
    paragraphs: [
      "A session cookie ordinarily expires when the browser session ends. A persistent cookie or local-storage value remains for the period set by Oremea or the relevant service provider, subject to deletion, expiry, account settings and applicable retention requirements.",
      "Security and authentication periods vary according to the feature, risk and provider configuration.",
    ],
  },
  {
    title: "8. Your controls",
    paragraphs: [
      "Browser settings can block or delete cookies and site data. Users can also use any consent control Oremea makes available for non-essential technologies.",
      "Blocking essential cookies may sign a user out, clear an in-progress session or prevent saved account and WORKS functions from operating.",
    ],
  },
  {
    title: "9. Changes and contact",
    paragraphs: [
      "Oremea will update this policy when material technologies, purposes or providers change. Questions or privacy requests may be sent to support@oremea.com.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalDocument
      activePath="/cookies"
      title="Cookie Policy"
      summary="How Oremea uses browser storage for accounts, security, requested features and carefully controlled analytics."
      updated="9 August 2026"
      sections={sections}
    />
  );
}
