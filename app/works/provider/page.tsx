import type { Metadata } from "next";

import { WorksProviderDashboard } from "@/components/works/provider/provider-dashboard";

export const metadata: Metadata = {
  title: "Manage my WORKS business | Oremea",
  robots: { index: false, follow: false },
};

export default function WorksProviderPage() {
  return <WorksProviderDashboard />;
}
