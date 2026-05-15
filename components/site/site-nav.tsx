"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function SiteNav() {
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.32em] text-amber-100 transition hover:text-white"
          >
            OREMEA
          </Link>

          <nav className="hidden items-center gap-6 text-[11px] uppercase tracking-[0.18em] text-zinc-300 md:flex">
            <Link
              href="/explore"
              className="transition hover:text-amber-100"
            >
              Explore
            </Link>

            <Link
              href="/compare"
              className="transition hover:text-amber-100"
            >
              Compare
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-amber-100"
            >
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/oremea/enter"
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-300 transition hover:border-white/20 hover:text-whiteder-white/20 hover:text-white md:inline-flex"
          >
            Begin Resonance
          </Link>

          <Link
            href={isSignedIn ? "/oremea/enter" : "/sign-in"}
            className="rounded-full border border-amber-200/30 bg-amber-100/[0.05] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/60 hover:bg-amber-100/10"
          >
            {isSignedIn ? "Profile" : "Log In"}
          </Link>
        </div>
      </div>
    </header>
  );
}