import type { Metadata } from "next";

import { SiteShell } from "@/components/site/site-shell";
import { MonetiseStokvelSignup } from "@/components/site/monetise-stokvel-signup";

export const metadata: Metadata = {
  title: "Monetise Stokvel | Oremea",
  description:
    "A South African education stokvel forming 17 committed participants around a R2,000 monthly contribution.",
  robots: {
    index: false,
    follow: false,
  },
};

const DEFAULT_WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/H7ppGIhkVjH931ZzJlWwFF";

export default function MonetiseStokvelPage() {
  const whatsappGroupUrl =
    process.env.MONETISE_STOKVEL_WHATSAPP_URL ?? DEFAULT_WHATSAPP_GROUP_URL;

  return (
    <SiteShell>
      <MonetiseStokvelSignup whatsappGroupUrl={whatsappGroupUrl} />
    </SiteShell>
  );
}
