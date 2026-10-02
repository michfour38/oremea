import { SiteShell } from "@/components/site/site-shell";
import CompletionFeedbackForm from "./completion-feedback-form";

export default function CompletionFeedbackPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 md:px-8 md:py-20">
        <header className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#c6a96b]/55" aria-hidden="true" />
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#c6a96b] sm:text-xs">
              Completion survey
            </p>
          </div>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.05] tracking-tight text-zinc-100 sm:text-5xl md:text-6xl">
            Tell us how the experience actually worked.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">
            A final look at what changed, what helped, what did not, and what should
            improve. Four quick ratings first; anything written after that is optional.
          </p>
        </header>

        <div className="mt-8 sm:mt-10">
          <CompletionFeedbackForm />
        </div>
      </section>
    </SiteShell>
  );
}
