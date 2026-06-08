"use client"

import Link from "next/link"
import { useState } from "react"

export function HarmonizeDrawer({
  systemId,
  cycleId,
}: {
  systemId: string
  cycleId?: string
}) {
  const [open, setOpen] = useState(false)

  const cycleLinks = cycleId
    ? [
        ["Private Witness", `/harmonize/system/${systemId}/cycle/${cycleId}/private`],
        ["Pattern Between", `/harmonize/system/${systemId}/cycle/${cycleId}/loop`],
        ["Shared Repair", `/harmonize/system/${systemId}/cycle/${cycleId}/shared`],
        ["Repair / Alignment", `/harmonize/system/${systemId}/cycle/${cycleId}/repair`],
        ["Review", `/harmonize/system/${systemId}/cycle/${cycleId}/review`],
        ["Complete", `/harmonize/system/${systemId}/cycle/${cycleId}/complete`],
      ]
    : []

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 top-5 z-40 rounded-full border border-[#c6a96b]/40 bg-black/70 px-4 py-2 text-sm text-[#c6a96b] backdrop-blur"
      >
        Harmonize
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/60">
          <aside className="ml-auto flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#0b0b0b] p-6 text-[#f4f1ea] shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto text-sm text-[#c6a96b]"
            >
              Close
            </button>

            <p className="mt-6 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
              Harmonize
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Navigation
            </h2>

            <nav className="mt-8 space-y-3">
              <Link
                href={`/harmonize/system/${systemId}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm hover:border-[#c6a96b]/50"
                onClick={() => setOpen(false)}
              >
                System Home
              </Link>

              <Link
                href={`/harmonize/system/${systemId}/invite`}
                className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm hover:border-[#c6a96b]/50"
                onClick={() => setOpen(false)}
              >
                Participants
              </Link>

              {cycleLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm hover:border-[#c6a96b]/50"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <p className="mt-auto pt-8 text-xs leading-5 text-[#777]">
              Private reflections remain private. Shared repair is chosen, not extracted.
            </p>
          </aside>
        </div>
      ) : null}
    </>
  )
}