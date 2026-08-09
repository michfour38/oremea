import Link from "next/link";

export function ProfileSupport() {
  return (
    <section className="border-b border-white/5 bg-black/25">
      <div className="mx-auto max-w-6xl px-5 py-7 md:py-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-950/70 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#b79a63]">
              Support
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Account access, payments and saved progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link
              href="/contact#contact-form"
              className="text-[#b79a63] underline decoration-[#b79a63]/30 underline-offset-4 transition hover:text-zinc-100"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
