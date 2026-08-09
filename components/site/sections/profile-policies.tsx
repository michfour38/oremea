import Link from "next/link";

export function ProfilePolicies() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-12">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
            Policies & Information
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-2xl font-light text-zinc-100">
              Platform Policies
            </h3>

            <p className="mt-4 text-base leading-7 text-zinc-400">
              Oremea maintains transparent platform policies, privacy standards, and participation guidelines across the ecosystem.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/terms"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm tracking-[0.16em] text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                Terms
              </Link>

              <Link
                href="/privacy"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm tracking-[0.16em] text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                Privacy
              </Link>

              <Link
                href="/refunds"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm tracking-[0.16em] text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                Refunds
              </Link>

              <Link
                href="/disclaimer"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm tracking-[0.16em] text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                Disclaimer
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200/10 bg-amber-100/[0.03] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-amber-100/70">
              Ecosystem Principles
            </p>

            <div className="mt-4 space-y-3 text-base leading-7 text-zinc-400">
              <p>
                Oremea is built around structured awareness, reflective clarity, intentional communication, and self-led participation.
              </p>

              <p>
                Private reflections remain private unless intentionally shared by the user.
              </p>

              <p>
                The ecosystem is designed to support awareness, execution, alignment, and intentional connection without dependency-driven engagement systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
