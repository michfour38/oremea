import { SiteShell } from "@/components/site/site-shell";
import FeedbackForm from "./feedback-form";

export default function FeedbackPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <header className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.32em] text-[#c6a96b]">
            Feedback
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
            Contact Oremea.
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            A quick private route to tell us something, flag a problem, ask a
            question, or request a reply.
          </p>
        </header>

        <div className="mt-10">
          <FeedbackForm />
        </div>
      </section>
    </SiteShell>
  );
}
