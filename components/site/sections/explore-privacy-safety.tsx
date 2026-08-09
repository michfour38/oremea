import Link from "next/link";

export function ExplorePrivacySafety() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#b79a63]">
                Privacy &amp; safety
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-light leading-tight text-zinc-100 md:text-5xl">
                Your participation remains yours.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">
                Oremea&apos;s reflective products are self-led. Private
                reflections remain private, participation is never forced, and
                synthesis is designed to support—not replace—your judgment.
              </p>
            </div>

            <div className="space-y-3 text-sm leading-7 text-zinc-500 lg:text-right">
              <p>
                Oremea does not provide therapy, medical treatment, diagnosis,
                crisis support, or emergency care.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <Link
              href="/compare"
              className="rounded-full border border-[#b79a63]/30 bg-[#b79a63]/[0.05] px-5 py-2.5 text-sm text-[#b79a63] transition hover:border-[#b79a63]/60 hover:bg-[#b79a63]/10"
            >
              Compare reflective products
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-400 transition hover:border-white/25 hover:text-zinc-100"
            >
              Read privacy policy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
