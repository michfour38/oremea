import { WorksProviderDashboard } from "@/components/works/provider/provider-dashboard";

export default function WorksProviderPage() {
  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl justify-end px-5 pt-5 md:px-8">
        <a href="/works/provider/inbox" className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#1f1c17]">
          Provider inbox →
        </a>
      </div>
      <WorksProviderDashboard />
    </>
  );
}
