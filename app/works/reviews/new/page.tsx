import { WorksCustomerReviewForm } from "@/components/works/reviews/customer-review-form";
import { WorksPageHeader } from "@/components/works/works-brand";

export default function WorksReviewPage({ searchParams }: { searchParams: { outreach?: string } }) {
  const outreachId = searchParams.outreach;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
      <WorksPageHeader context="Customer review" />
      {outreachId ? <WorksCustomerReviewForm outreachId={outreachId} /> : <p className="py-14 text-sm text-black/45">Open a provider interaction from My WORKS to leave a review.</p>}
    </main>
  );
}
