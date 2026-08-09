import Link from "next/link";

import {
  LEGAL_LINKS,
  OREMEA_OPERATOR,
  WORKS_LEGAL_LINKS,
} from "@/src/lib/legal/legal-links";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-14 md:flex-row md:justify-between">
        <div className="max-w-md">
          <p className="text-sm font-semibold tracking-[0.32em] text-[#b79a63]">
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

        <div className="grid grid-cols-1 gap-10 text-sm sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Ecosystem
            </p>

            <div className="flex flex-col gap-3 text-zinc-300">
              <Link href="/explore" className="transition hover:text-[#b79a63]">
                Explore
              </Link>

              <Link
                href="/about/oremea"
                className="transition hover:text-[#b79a63]"
              >
                About Oremea
              </Link>

              <Link href="/reviews" className="transition hover:text-[#b79a63]">
                Reviews
              </Link>

              <Link href="/compare" className="transition hover:text-[#b79a63]">
                Compare
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Products
            </p>

            <div className="flex flex-col gap-3 text-zinc-300">
              <Link
                href="https://recognition.oremea.com"
                className="transition hover:text-[#b79a63]"
              >
                Recognition
              </Link>

              <Link
                href="/resonance"
                className="transition hover:text-[#b79a63]"
              >
                Resonance
              </Link>

              <Link
                href="https://compass.oremea.com"
                className="transition hover:text-[#b79a63]"
              >
                Compass
              </Link>

              <Link href="/works" className="transition hover:text-[#b79a63]">
                WORKS
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Legal
            </p>

            <div className="flex flex-col gap-3 text-zinc-300">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-[#b79a63]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              WORKS legal
            </p>

            <div className="flex flex-col gap-3 text-zinc-300">
              {WORKS_LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-[#b79a63]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Contact
            </p>

            <div className="flex flex-col gap-3 text-zinc-300">
              <Link href="/contact" className="transition hover:text-[#b79a63]">
                Contact
              </Link>

              <Link
                href="/contact#contact-form"
                className="transition hover:text-[#b79a63]"
              >
                {OREMEA_OPERATOR.email}
              </Link>

              <a
                href={"tel:" + OREMEA_OPERATOR.telephone.replace(/\s/g, "")}
                className="transition hover:text-[#b79a63]"
              >
                {OREMEA_OPERATOR.telephone}
              </a>

              <p className="max-w-56 leading-6 text-zinc-500">
                {OREMEA_OPERATOR.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-[11px] tracking-[0.16em] text-zinc-600">
            © {new Date().getFullYear()} Oremea · Operated by{" "}
            {OREMEA_OPERATOR.name}, {OREMEA_OPERATOR.legalForm}
          </p>

          <p className="text-[11px] tracking-[0.16em] text-zinc-600">
            Self-led reflective systems • Structured awareness • Intentional
            participation
          </p>
        </div>
      </div>
    </footer>
  );
}
