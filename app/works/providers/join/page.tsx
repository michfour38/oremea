import type { Metadata } from "next";

import { WorksProviderOnboardingV2 } from "@/components/works/provider/provider-onboarding-v2";
import { worksUrl } from "@/lib/works/seo";

export const metadata: Metadata = {
  title: "List your manufacturing business | WORKS",
  description:
    "Add or connect a South African manufacturer, supplier or business-service provider and manage how customers find your business on WORKS.",
  alternates: { canonical: worksUrl("/providers/join") },
};

export default function WorksProviderJoinPage() {
  return <WorksProviderOnboardingV2 />;
}
