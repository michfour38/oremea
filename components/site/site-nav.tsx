"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { CurrentBell } from "./current-bell";

function NavItem({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const isActive = pathname === href;

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

  const isEnterPage = pathname === "/oremea/enter";

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
            <NavItem href="/reviews" label="Reviews" pathname={pathname} />
            <NavItem href="/compare" label="Compare" pathname={pathname} />
            <NavItem href="/contact" label="Contact" pathname={pathname} />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CurrentBell signedIn={Boolean(isSignedIn)} />

          <Link
            href={isSignedIn ? "/profile" : "/sign-in"}
            className="rounded-full border border-[#b79a63]/30 bg-[#b79a63]/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#b79a63] transition hover:border-[#b79a63]/60 hover:bg-[#b79a63]/10"
          >
            {isSignedIn ? "Profile" : "Log In"}
          </Link>
        </div>
      </div>
    </header>
  );
}
