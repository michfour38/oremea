import type { Metadata } from "next";

import { WorksProviderOnboardingV2 } from "@/components/works/provider/provider-onboarding-v2";

export const metadata: Metadata = {
  title: "List your business on WORKS | Oremea",
  description:
    "Add or connect a South African manufacturer, supplier or business-service provider and manage how customers find your business on WORKS.",
  alternates: { canonical: "https://works.oremea.com/works/providers/join" },
};

export default function WorksProviderJoinPage() {
  return <WorksProviderOnboardingV2 />;
}
