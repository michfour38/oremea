import Link from "next/link";
import type { ReactNode } from "react";

import {
  LEGAL_LINKS,
  LEGAL_RETURN_LINK,
  OREMEA_OPERATOR,
  WORKS_LEGAL_LINKS,
} from "@/src/lib/legal/legal-links";

export type LegalSection = {
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
};

type LegalReference = {
  label: string;
  href: string;
};

type LegalDocumentProps = {
  activePath: string;
  title: string;
  summary: string;
  updated: string;
  sections: readonly LegalSection[];
  references?: readonly LegalReference[];
  returnLink?: { href: string; label: string };
  children?: ReactNode;
};

function sectionId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function LegalDocument({
  activePath,
  title,
  summary,
  updated,
  sections,
  references = [],
  returnLink = LEGAL_RETURN_LINK,
  children,
}: LegalDocumentProps) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-white/10 bg-black/35">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link
            href={LEGAL_RETURN_LINK.href}
            className="text-xs font-semibold tracking-[0.3em] text-amber-100 transition hover:text-white"
          >
            OREMEA
          </Link>
          <Link
            href={returnLink.href}
            className="rounded-full border border-amber-100/25 bg-amber-100/[0.06] px-4 py-2 text-xs text-amber-100 transition hover:border-amber-100/55 hover:bg-amber-100/10"
          >
            ← {returnLink.label}
          </Link>
        </nav>
      </div>

      <header className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.13),transparent_34%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
            Oremea legal
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-light leading-tight text-white md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-300">
            {summary}
          </p>
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-zinc-500">
            Last updated {updated}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-14">
        <aside className="hidden lg:block">
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              In this document
            </p>
            <nav
              className="mt-4 flex flex-col gap-3"
              aria-label={`${title} contents`}
            >
              {sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${sectionId(section.title)}`}
                  className="text-xs leading-5 text-zinc-400 transition hover:text-amber-100"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="min-w-0">
          <details className="mb-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5 lg:hidden">
            <summary className="cursor-pointer text-sm text-zinc-200">
              In this document
            </summary>
            <nav
              className="mt-4 flex flex-col gap-3"
              aria-label={`${title} mobile contents`}
            >
              {sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${sectionId(section.title)}`}
                  className="text-sm leading-6 text-zinc-400"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </details>

          <div className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border border-white/10 bg-black/25">
            {sections.map((section) => (
              <section
                key={section.title}
                id={sectionId(section.title)}
                className="scroll-mt-8 p-6 md:p-8"
              >
                <h2 className="text-xl font-medium leading-8 text-white">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-300 md:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.items?.length ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-300 md:text-base">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {children}

          {references.length ? (
            <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
              <h2 className="text-lg font-medium text-white">
                Official references
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {references.map((reference) => (
                  <a
                    key={reference.href}
                    href={reference.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-amber-100/80 underline decoration-amber-100/25 underline-offset-4 transition hover:text-amber-100"
                  >
                    {reference.label} ↗
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <LegalDirectory activePath={activePath} />

          <div className="mt-8 flex flex-col gap-4 rounded-[2rem] border border-amber-100/15 bg-amber-100/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div>
              <p className="text-sm text-zinc-200">
                Operated by {OREMEA_OPERATOR.name}, {OREMEA_OPERATOR.legalForm}
              </p>
              <Link
                href="/contact#contact-form"
                className="mt-2 inline-block text-sm text-amber-100/80 transition hover:text-amber-100"
              >
                {OREMEA_OPERATOR.email}
              </Link>
            </div>
            <Link
              href={returnLink.href}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white"
            >
              ← {returnLink.label}
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}

function LegalDirectory({ activePath }: { activePath: string }) {
  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-black/25 p-6 md:p-8">
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
        Legal directory
      </p>
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <LegalGroup
          title="Oremea"
          links={LEGAL_LINKS}
          activePath={activePath}
        />
        <LegalGroup
          title="WORKS"
          links={WORKS_LEGAL_LINKS}
          activePath={activePath}
        />
      </div>
    </section>
  );
}

function LegalGroup({
  title,
  links,
  activePath,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
  activePath: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-medium text-zinc-200">{title}</h2>
      <nav
        className="mt-3 flex flex-col gap-2"
        aria-label={`${title} legal documents`}
      >
        {links.map((link) =>
          link.href === activePath ? (
            <span key={link.href} className="text-sm text-amber-100/60">
              {link.label}
            </span>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition hover:text-amber-100"
            >
              {link.label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
