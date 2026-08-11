import type { Metadata } from "next";

import { WorksProviderDashboard } from "@/components/works/provider/provider-dashboard";

export const metadata: Metadata = {
  title: "Manage my WORKS business | Oremea",
  robots: { index: false, follow: false },
};

export default function WorksProviderPage() {
  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap justify-end gap-2 px-5 pt-5 md:px-8">
        <a href="/works/providers/plans" className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#1f1c17]">
          Plans & upgrade →
        </a>
        <a href="/works/provider/inbox" className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#1f1c17]">
          Provider inbox →
        </a>
      </div>
      <WorksProviderDashboard />
    </>
  );
}
