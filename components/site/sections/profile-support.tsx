export function ProfileSupport() {
  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-12">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
            Support
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
              Contact
            </p>

            <h3 className="mt-3 text-2xl font-light text-zinc-100">
              Need assistance?
            </h3>

            <p className="mt-4 text-base leading-7 text-zinc-400">
              Oremea support is available for account assistance, access questions,
              payment concerns, and platform-related support.
            </p>

            <div className="mt-5">
              <a
                href="mailto:support@oremea.com"
                className="inline-flex rounded-full border border-amber-200/20 bg-amber-100/[0.05] px-5 py-3 text-sm tracking-[0.16em] text-amber-100 transition hover:border-amber-100/50 hover:bg-amber-100/[0.08]"
              >
                support@oremea.com
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
              Important
            </p>

            <div className="mt-4 space-y-3 text-base leading-7 text-zinc-400">
              <p>
                Oremea is designed around self-led reflective systems and intentional participation.
              </p>

              <p>
                The platform does not provide therapy, crisis support, or medical services.
              </p>

              <p>
                Expanded recognition tools support reflective synthesis and awareness rather than replacing personal judgment or professional care.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
