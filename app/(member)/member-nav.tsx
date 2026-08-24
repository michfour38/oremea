"use client"

import { SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type OpenMenu = "archive" | "profile" | null

function ProductLink({
  href,
  label,
  pathname,
  activePath,
}: {
  href: string
  label: string
  pathname: string
  activePath: string
}) {
  const active =
    pathname === activePath ||
    (activePath !== "/" && pathname.startsWith(activePath))

  return (
    <a
      href={href}
      className={`text-[11px] uppercase tracking-[0.18em] transition ${
        active
          ? "text-[#E7C98B]"
          : "text-white/45 hover:text-white/80"
      }`}
    >
      {label}
    </a>
  )
}

export default function MemberNav() {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [hasCompassAccess, setHasCompassAccess] = useState(false)

  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setOpenMenu(null)
  }, [pathname, searchParams])

  useEffect(() => {
    let cancelled = false

    async function refreshCompassAccess() {
      try {
        const response = await fetch("/api/compass/access", {
          cache: "no-store",
        })
        const data = await response.json().catch(() => null)

        if (!cancelled) {
          setHasCompassAccess(Boolean(response.ok && data?.active))
        }
      } catch {
        if (!cancelled) setHasCompassAccess(false)
      }
    }

    void refreshCompassAccess()

    return () => {
      cancelled = true
    }
  }, [pathname, searchParams])

  return (
    <nav className="relative z-[300] border-b border-white/5 bg-black/50 px-6 py-2 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between">
        <div className="flex h-12 items-center gap-6">
          <Link
            href="https://www.oremea.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] uppercase tracking-[0.28em] text-[#C8A96A]/90 transition hover:text-[#f1dfb4]"
          >
            Oremea
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            <ProductLink
              href="https://recognition.oremea.com/begin"
              activePath="/recognition"
              label="Recognition"
              pathname={pathname}
            />
            <ProductLink
              href="https://resonance.oremea.com/"
              activePath="/resonance"
              label="Resonance"
              pathname={pathname}
            />
            {hasCompassAccess ? (
              <ProductLink
                href="https://compass.oremea.com/begin"
                activePath="/compass"
                label="Compass"
                pathname={pathname}
              />
            ) : null}
          </div>
        </div>

        <div className="ml-auto flex h-12 items-center justify-end gap-3">
          <div
            className="relative flex h-12 items-center"
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              type="button"
              onClick={() =>
                setOpenMenu(openMenu === "archive" ? null : "archive")
              }
              className="flex h-10 items-center px-3 text-sm font-medium text-zinc-300 transition hover:text-white"
            >
              Archive
            </button>

            {openMenu === "archive" ? (
              <div className="absolute right-0 top-12 z-[200] min-w-[230px] rounded-[1.75rem] border border-zinc-800/80 bg-zinc-950/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
                <div className="grid gap-2">
                  <a
                    href="https://recognition.oremea.com/archive"
                    className="rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]"
                  >
                    Recognition Archive
                  </a>

                  <a
                    href="https://resonance.oremea.com/archive?view=day"
                    className="rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]"
                  >
                    Resonance Archive
                  </a>

                  <a
                    href="https://compass.oremea.com/archive"
                    className="rounded-full border border-[#3A3224] bg-[#17130D] px-4 py-2 text-center text-sm text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]"
                  >
                    Compass Archive
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="relative flex h-12 items-center"
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              type="button"
              onClick={() =>
                setOpenMenu(openMenu === "profile" ? null : "profile")
              }
              className="flex h-10 items-center rounded-full border border-white/10 bg-black/20 px-4 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              Profile
            </button>

            {openMenu === "profile" ? (
              <div className="absolute right-0 top-12 z-[200] min-w-[240px] rounded-[1.75rem] border border-zinc-800/80 bg-zinc-950/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
                <a
                  href="https://www.oremea.com/profile"
                  className="block rounded-xl px-4 py-3 text-center text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Profile
                </a>

                <a
                  href="https://www.oremea.com/compare"
                  className="mt-1 block rounded-xl px-4 py-3 text-center text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Compare Products
                </a>

                <a
                  href="https://www.oremea.com/reviews/share"
                  className="mt-1 block rounded-xl px-4 py-3 text-center text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Share Your Experience
                </a>

                <a
                  href="https://www.oremea.com/contact"
                  className="mt-1 block rounded-xl px-4 py-3 text-center text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Contact Support
                </a>

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
  )
}
