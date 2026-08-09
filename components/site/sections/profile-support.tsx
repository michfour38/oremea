import Link from "next/link";

export function ProfileSupport() {
  return (
    <section className="border-b border-white/5 bg-zinc-950/65">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 lg:grid-cols-2">
          <div className="bg-zinc-950/90 p-7 md:p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
              Support
            </p>
            <h2 className="mt-4 text-3xl font-light text-white">
              A clear way back in
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-zinc-400">
              Account access, payment questions, saved progress, and platform
              support all begin in one place.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:support@oremea.com"
                className="inline-flex items-center justify-center rounded-full bg-amber-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white"
              >
                Email support
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 transition hover:border-white/35 hover:text-white"
              >
                Contact Oremea
              </Link>
            </div>
          </div>

          <div className="bg-amber-100/[0.045] p-7 md:p-10">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-100/65">
              The container
            </p>
            <div className="mt-5 space-y-5 text-sm leading-7 text-zinc-300">
              <p>
                Oremea holds self-led reflective work, structured participation,
                and the records created through that work.
              </p>
              <p>
                Personal judgment remains the authority. Clinical, crisis, and
                medical care remain with qualified professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
