"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { CurrentBell } from "./current-bell";
import { FeedbackIcon } from "./feedback-icon";

const ACTIVE_PRODUCT_LINKS = [
  {
    href: "https://recognition.oremea.com",
    label: "Recognition",
  },
  {
    href: "https://resonance.oremea.com",
    label: "Resonance",
  },
  {
    href: "https://compass.oremea.com",
    label: "Compass",
  },
] as const;

function NavItem({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  if (isActive) {
    return <span className="cursor-default text-[#b79a63]/70">{label}</span>;
  }

  return (
    <Link href={href} className="transition hover:text-[#b79a63]">
      {label}
    </Link>
  );
}

export function SiteNav() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const feedbackActive =
    pathname === "/feedback" || pathname.startsWith("/feedback/");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.32em] text-[#b79a63] transition hover:text-zinc-100"
          >
            OREMEA
          </Link>

          <nav className="hidden items-center gap-6 text-[11px] uppercase tracking-[0.18em] text-zinc-300 md:flex">
            <NavItem href="/explore" label="Explore" pathname={pathname} />
            <NavItem href="/works" label="WORKS" pathname={pathname} />
            <NavItem href="/reviews" label="Reviews" pathname={pathname} />
            <NavItem href="/compare" label="Compare" pathname={pathname} />
            <NavItem href="/contact" label="Contact" pathname={pathname} />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CurrentBell signedIn={Boolean(isSignedIn)} />
          <FeedbackIcon active={feedbackActive} />

          {isSignedIn ? (
            <details className="group relative">
              <summary className="list-none cursor-pointer rounded-full border border-[#b79a63]/30 bg-[#b79a63]/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#b79a63] transition hover:border-[#b79a63]/60 hover:bg-[#b79a63]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b79a63] [&::-webkit-details-marker]:hidden">
                Profile ▾
              </summary>
              <nav aria-label="Account menu" className="absolute right-0 top-full z-[60] mt-3 min-w-44 overflow-hidden rounded-xl border border-[#b79a63]/30 bg-zinc-950 p-2 shadow-2xl">
                <Link href="/profile" className="block rounded-lg px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10">My profile</Link>
                <Link href="/sign-out" className="block rounded-lg px-4 py-3 text-sm text-[#e7c98b] transition hover:bg-white/10">Sign out</Link>
              </nav>
            </details>
          ) : (
            <Link href="/sign-in" className="rounded-full border border-[#b79a63]/30 bg-[#b79a63]/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#b79a63] transition hover:border-[#b79a63]/60 hover:bg-[#b79a63]/10">Log In</Link>
          )}
        </div>
      </div>

      <nav
        aria-label="Oremea products"
        className="grid grid-cols-3 border-t border-white/[0.06] md:hidden"
      >
        {ACTIVE_PRODUCT_LINKS.map((product, index) => (
          <Link
            key={product.label}
            href={product.href}
            className={`flex min-h-11 items-center justify-center px-2 py-3 text-center text-[10px] uppercase tracking-[0.14em] text-[#b79a63] transition hover:bg-[#b79a63]/[0.06] hover:text-[#f1dfb4] ${
              index > 0 ? "border-l border-white/[0.06]" : ""
            }`}
          >
            {product.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
