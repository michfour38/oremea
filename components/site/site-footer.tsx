import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-14 md:flex-row md:justify-between">
        <div className="max-w-md">
          <p className="text-sm font-semibold tracking-[0.32em] text-amber-100">
            OREMEA
          </p>

          <p className="mt-5 text-sm leading-8 text-zinc-400">
            Structured awareness systems for relational clarity, intentional
            communication, execution alignment, and conscious connection.
          </p>

          <p className="mt-5 text-sm leading-8 text-zinc-500">
            Oremea products are designed around self-led reflection, pattern
            recognition, and intentional participation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 text-sm sm:grid-cols-4">
          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Ecosystem
            </p>

            <div className="flex flex-col gap-3 text-zinc-300">
              <Link href="/explore" className="transition hover:text-amber-100">
                Explore
              </Link>

              <Link href="/reviews" className="transition hover:text-amber-100">
                Reviews
              </Link>

              <Link href="/compare" className="transition hover:text-amber-100">
                Compare
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Products
            </p>

            <div className="flex flex-col gap-3 text-zinc-300">
              <Link href="/oremea" className="transition hover:text-amber-100">
                Resonance
              </Link>

              <Link href="/harmonize" className="transition hover:text-amber-100">
                Harmonize
              </Link>

              <Link href="/compass" className="transition hover:text-amber-100">
                Compass
              </Link>

              <p className="text-zinc-500">The Current</p>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Policies
            </p>

            <div className="flex flex-col gap-3 text-zinc-300">
              <Link href="/terms" className="transition hover:text-amber-100">
                Terms
              </Link>

              <Link href="/privacy" className="transition hover:text-amber-100">
                Privacy
              </Link>

              <Link href="/refunds" className="transition hover:text-amber-100">
                Refunds
              </Link>

              <Link href="/disclaimer" className="transition hover:text-amber-100">
                Disclaimer
              </Link>

              <Link href="/conduct" className="transition hover:text-amber-100">
                Conduct
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Contact
            </p>

            <div className="flex flex-col gap-3 text-zinc-300">
              <Link href="/contact" className="transition hover:text-amber-100">
                Contact
              </Link>

              <a
                href="mailto:support@oremea.com"
                className="transition hover:text-amber-100"
              >
                support@oremea.com
              </a>

              <p className="text-zinc-500">South Africa</p>
              <p className="text-zinc-500">Local is Lekker</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-[11px] tracking-[0.16em] text-zinc-600">
            © {new Date().getFullYear()} Oremea
          </p>

          <p className="text-[11px] tracking-[0.16em] text-zinc-600">
            Self-led reflective systems • Structured awareness • Intentional participation
          </p>
        </div>
      </div>
    </footer>
  );
}