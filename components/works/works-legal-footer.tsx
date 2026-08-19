"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LEGAL_LINKS,
  OREMEA_OPERATOR,
  WORKS_LEGAL_LINKS,
} from "@/src/lib/legal/legal-links";

const OREMEA_SITE_ORIGIN = "https://www.oremea.com";
const OREMEA_LEGAL_LINKS = LEGAL_LINKS.map((link) => ({
  ...link,
  href: `${OREMEA_SITE_ORIGIN}${link.href}`,
}));

export function WorksLegalFooter({ currentYear }: { currentYear: number }) {
  const pathname = usePathname();
  const internalPathname = pathname.startsWith("/works")
    ? pathname
    : pathname === "/"
      ? "/works"
      : `/works${pathname}`;

  if (WORKS_LEGAL_LINKS.some((link) => link.href === internalPathname)) {
    return null;
  }

  return (
    <footer className="border-t border-black/10 bg-[#f3eee4] text-[#1f1c17]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-[1.2fr_1fr_1fr] md:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8b6a31]">
            WORKS by Oremea
          </p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-black/55">
            South African business discovery, production routing and provider
            introductions with clear evidence boundaries.
          </p>
          <Link
            href={OREMEA_SITE_ORIGIN}
            className="mt-5 inline-flex text-sm text-black/65 underline decoration-black/20 underline-offset-4 transition hover:text-black"
          >
            Return to Oremea
          </Link>
        </div>

        <FooterGroup title="WORKS legal" links={WORKS_LEGAL_LINKS} />
        <FooterGroup title="Oremea legal" links={OREMEA_LEGAL_LINKS} />
      </div>

      <div className="border-t border-black/10 px-5 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs leading-6 text-black/45 md:flex-row md:items-center md:justify-between md:px-3">
          <p>
            © {currentYear} Oremea · Operated by{" "}
            {OREMEA_OPERATOR.name}, {OREMEA_OPERATOR.legalForm}
          </p>
          <Link
            href={`${OREMEA_SITE_ORIGIN}/contact#contact-form`}
            className="transition hover:text-black"
          >
            {OREMEA_OPERATOR.email}
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-black/40">
        {title}
      </p>
      <nav className="mt-4 grid gap-3" aria-label={title}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-black/60 transition hover:text-black"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
