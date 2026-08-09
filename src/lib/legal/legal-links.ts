export const LEGAL_RETURN_LINK = {
  href: "/",
  label: "Return to Oremea",
} as const;

export const WORKS_RETURN_LINK = {
  href: "/works",
  label: "Return to WORKS",
} as const;

export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy & POPIA" },
  { href: "/refunds", label: "Payments & Refunds" },
  { href: "/disclaimer", label: "AI & Service Disclaimer" },
  { href: "/conduct", label: "Acceptable Use" },
  { href: "/cookies", label: "Cookies" },
  { href: "/paia", label: "PAIA Manual" },
] as const;

export const WORKS_LEGAL_LINKS = [
  { href: "/works/terms", label: "WORKS Terms" },
  { href: "/works/verification", label: "Verification Policy" },
  { href: "/works/reviews-policy", label: "Reviews Policy" },
  {
    href: "/works/partner-disclosure",
    label: "Partner Disclosure",
  },
] as const;

export const OREMEA_OPERATOR = {
  name: "Michelle Fourie",
  tradingName: "Oremea",
  legalForm: "sole proprietor",
  email: "support@oremea.com",
  telephone: "061 537 5188",
  address: "Gauteng, South Africa",
} as const;
