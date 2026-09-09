import { SiteShell } from "@/components/site/site-shell";
import CompletionFeedbackForm from "./completion-feedback-form";

export default function CompletionFeedbackPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-4xl px-6 py-16 md:px-10 md:py-24">
        <header className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.32em] text-[#c6a96b]">
            Before you leave
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
            What changed?
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            A few seconds here helps Oremea learn whether the experience actually
            did what it was built to do.
          </p>
        </header>

        <div className="mt-10">
          <CompletionFeedbackForm />
        </div>
      </section>
    </SiteShell>
  );
}
