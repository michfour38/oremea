"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type OpenMenu = "archive" | "profile" | null;

export default function MemberNav() {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname, searchParams]);

  return (
    <nav className="relative z-[300] border-b border-white/5 bg-black/40 px-6 py-2 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between">
        <div className="hidden h-12 items-center gap-5 md:flex">
          <Link href="/" className="text-[11px] uppercase tracking-[0.28em] text-[#C8A96A]/80 transition hover:text-[#f1dfb4]">
            Oremea
          </Link>
          <Link href="/explore" className="text-[11px] uppercase tracking-[0.18em] text-white/45 transition hover:text-white/80">
            Explore
          </Link>
          <Link href="/compare" className="text-[11px] uppercase tracking-[0.18em] text-white/45 transition hover:text-white/80">
            Compare
          </Link>
          <Link href="/contact" className="text-[11px] uppercase tracking-[0.18em] text-white/45 transition hover:text-white/80">
            Contact
          </Link>
        </div>

        <div className="ml-auto flex h-12 items-center justify-end gap-3">
          <div className="relative flex h-12 items-center" onMouseLeave={() => setOpenMenu(null)}>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === "archive" ? null : "archive")}
              className="flex h-10 items-center px-3 text-sm font-medium text-zinc-300 transition hover:text-white"
            >
              Archive
            </button>

            {openMenu === "archive" ? (
              <div className="absolute right-0 top-12 z-[200] min-w-[220px] rounded-[1.75rem] border border-zinc-800/80 bg-zinc-950/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
                <div className="grid gap-2">
  <Link href="/journey/archive?view=day" className="rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]">
    Resonance
  </Link>

  <Link href="/current" className="rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]">
    Current
  </Link>

  <Link href="/compass/archive" className="rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]">
  Compass
</Link>

  <Link href="/harmonize" className="rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]">
    Harmonize
  </Link>
</div>
              </div>
            ) : null}
          </div>

          <div className="relative flex h-12 items-center" onMouseLeave={() => setOpenMenu(null)}>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}
              className="flex h-10 items-center rounded-full border border-white/10 bg-black/20 px-4 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              Profile
            </button>

            {openMenu === "profile" ? (
              <div className="absolute right-0 top-12 z-[200] min-w-[240px] rounded-[1.75rem] border border-zinc-800/80 bg-zinc-950/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
                <Link href="/profile" className="block rounded-xl px-4 py-3 text-center text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white">
                  Profile
                </Link>
                <Link href="/compare" className="mt-1 block rounded-xl px-4 py-3 text-center text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white">
                  Compare Products
                </Link>
                <Link href="/contact" className="mt-1 block rounded-xl px-4 py-3 text-center text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white">
                  Contact Support
                </Link>

                <div className="mt-2 border-t border-zinc-800 pt-2">
                  <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                    <button
                      type="button"
                      className="block w-full rounded-xl px-4 py-3 text-center text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                    >
                      Sign out
                    </button>
                  </SignOutButton>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}