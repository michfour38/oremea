import type { Metadata } from "next";

import { ProviderClaimVerification } from "@/components/works/provider/provider-claim-verification";

export const metadata: Metadata = {
  title: "Verify business connection | WORKS",
  robots: { index: false, follow: false },
};

export default function VerifyProviderClaimPage() {
  return <ProviderClaimVerification />;
}
