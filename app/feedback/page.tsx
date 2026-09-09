import { SiteShell } from "@/components/site/site-shell";
import FeedbackForm from "./feedback-form";

export default function FeedbackPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-4xl px-6 py-16 md:px-10 md:py-24">
        <header className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.32em] text-[#c6a96b]">
            Private feedback
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
            Tell Oremea what happened.
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            Something missed the thread, felt wrong, was unclear, broke, or could
            work better? Send it here. Feedback is used to improve the product.
          </p>
        </header>

        <div className="mt-9 rounded-3xl border border-[#c6a96b]/25 bg-[#181713]/90 p-6 text-sm leading-7 text-zinc-300 md:p-8">
          <p className="text-base text-zinc-100">This space is private.</p>
          <p className="mt-2">
            Feedback sent here is not added to Reviews, is not treated as a
            testimonial, and is never publication consent. Public reflections use a
            separate Reviews submission.
          </p>
        </div>

        <div className="mt-10">
          <FeedbackForm />
        </div>
      </section>
    </SiteShell>
  );
}
