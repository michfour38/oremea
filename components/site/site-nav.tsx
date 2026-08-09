"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

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
    return (
      <span className="cursor-default text-amber-100/60">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="transition hover:text-amber-100"
    >
      {label}
    </Link>
  );
}

export function SiteNav() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!archiveOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !archiveMenuRef.current?.contains(event.target)
      ) {
        setArchiveOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setArchiveOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [archiveOpen]);

  const isEnterPage = pathname === "/oremea/enter";

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
  <NavItem href="/explore" label="Explore" pathname={pathname} />
  <NavItem href="/reviews" label="Reviews" pathname={pathname} />
  <NavItem href="/compare" label="Compare" pathname={pathname} />
  <NavItem href="/contact" label="Contact" pathname={pathname} />
</nav>
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <div ref={archiveMenuRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={archiveOpen}
                aria-controls="site-archive-menu"
                onClick={() => setArchiveOpen((open) => !open)}
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-300 transition hover:border-amber-200/30 hover:text-amber-100"
              >
                Archive
              </button>

              {archiveOpen ? (
                <div
                  id="site-archive-menu"
                  role="menu"
                  className="absolute right-0 top-12 z-[200] min-w-[230px] rounded-[1.5rem] border border-zinc-800/80 bg-zinc-950/95 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  <a
                    role="menuitem"
                    href="https://recognition.oremea.com/archive"
                    className="block rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm normal-case tracking-normal text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]"
                  >
                    Recognition Archive
                  </a>
                  <a
                    role="menuitem"
                    href="https://resonance.oremea.com/archive?view=day"
                    className="mt-2 block rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm normal-case tracking-normal text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]"
                  >
                    Resonance Archive
                  </a>
                  <a
                    role="menuitem"
                    href="https://compass.oremea.com/archive"
                    className="mt-2 block rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm normal-case tracking-normal text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]"
                  >
                    Compass Archive
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

          <Link
            href={isSignedIn ? "/profile" : "/sign-in"}
            className="rounded-full border border-amber-200/30 bg-amber-100/[0.05] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/60 hover:bg-amber-100/10"
          >
            {isSignedIn ? "Profile" : "Log In"}
          </Link>
        </div>
      </div>
    </header>
  );
}
