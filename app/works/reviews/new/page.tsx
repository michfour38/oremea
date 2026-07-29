import { WorksCustomerReviewForm } from "@/components/works/reviews/customer-review-form";

export default function WorksReviewPage({ searchParams }: { searchParams: { outreach?: string } }) {
  const outreachId = searchParams.outreach;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
      <header className="border-b border-black/10 pb-5">
        <a href="/works/my" className="text-xs font-semibold uppercase tracking-[0.32em] text-[#16834f]">WORKS</a>
        <p className="mt-1 text-xs text-black/40">Customer review · by Oremea</p>
      </header>
      {outreachId ? <WorksCustomerReviewForm outreachId={outreachId} /> : <p className="py-14 text-sm text-black/45">Open a provider interaction from My WORKS to leave a review.</p>}
    </main>
  );
}