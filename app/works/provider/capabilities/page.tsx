import type { Metadata } from "next";

import { WorksProviderCapabilities } from "@/components/works/provider/provider-capabilities";

export const metadata: Metadata = {
  title: "Provider capabilities | WORKS by Oremea",
  robots: { index: false, follow: false },
};

export default function WorksProviderCapabilitiesPage() {
  return <WorksProviderCapabilities />;
}
