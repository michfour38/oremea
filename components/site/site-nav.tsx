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

function FeedbackIcon({ pathname }: { pathname: string }) {
  const isActive =
    pathname === "/feedback" || pathname.startsWith("/feedback/");

  return (
    <Link
      href="/feedback"
      aria-label="Feedback"
      title="Feedback"
      className={`flex h-10 w-10 items-center justify-center rounded-full border bg-black/20 transition ${
        isActive
          ? "border-[#b79a63]/70 text-[#b79a63]"
          : "border-[#b79a63]/35 text-[#e7c98b] hover:border-[#b79a63]/70 hover:bg-[#b79a63]/[0.06]"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px] fill-none stroke-current"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4.2-.9L3 21l1.6-4.1A8.1 8.1 0 0 1 3 12c0-4.7 4-8.5 9-8.5s9 3.6 9 8Z" />
        <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
      </svg>
    </Link>
  );
}

export function SiteNav() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

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
          <FeedbackIcon pathname={pathname} />

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
