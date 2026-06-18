"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

const agreements = [
  "Private reflections remain private.",
  "Shared repair is chosen, not extracted.",
  "Understanding is more important than agreement.",
  "Repair is invitation, not obligation.",
  "Harmonize does not determine who is right.",
  "Participants remain responsible for their own choices.",
  "Minor participation is not available in this version.",
]

export default function HarmonizeAgreementPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "couple"

  const [revealed, setRevealed] = useState(0)
  const [safetyAccepted, setSafetyAccepted] = useState(false)
const storageKey = `harmonize-agreement-${mode}`

  const allRevealed = revealed >= agreements.length
  const canContinue = allRevealed && safetyAccepted

useEffect(() => {
  const savedAgreement = window.localStorage.getItem(storageKey)

  if (savedAgreement === "accepted") {
    setRevealed(agreements.length)
    setSafetyAccepted(true)
  }
}, [storageKey])

  function revealNext() {
    if (revealed < agreements.length) {
      setRevealed(revealed + 1)
    }
  }

  return (
    <main
      className="min-h-screen text-[#f4f1ea]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.74), rgba(0,0,0,0.74)), url('/images/harmonize/bg-harmonize-entry.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href={`/harmonize/start?mode=${mode}`}
          className="mb-8 text-sm text-[#c6a96b] hover:underline"
        >
          ← Back
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Harmonize Agreement
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          Read each agreement before continuing. Participation begins with
          consent, clarity, and responsibility.
        </p>

        <div className="mt-8 space-y-3">
          {agreements.map((text, index) => {
            const isVisible = index < revealed

            return (
              <button
                key={text}
                type="button"
                onClick={revealNext}
                disabled={isVisible && index !== revealed}
                className={`w-full rounded-2xl border p-4 text-left text-sm leading-6 transition ${
                  isVisible
                    ? "border-[#c6a96b]/30 bg-[#c6a96b]/10 text-[#f4f1ea]"
                    : "border-white/10 bg-white/[0.04] text-[#777] blur-[3px]"
                }`}
              >
                {isVisible ? text : "Agreement hidden until acknowledged."}
              </button>
            )
          })}
        </div>

        {!allRevealed ? (
          <button
            type="button"
            onClick={revealNext}
            className="mt-6 w-fit rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
          >
            I understand — reveal next
          </button>
        ) : null}

        {allRevealed ? (
          <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
            <h2 className="text-lg font-medium text-[#f4f1ea]">
              Safety note
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#d8d2c6]">
{`I understand that by continuing I shall be deemed to have read understood acknowledged and accepted these participation principles

My participation in Harmonize shall constitute my agreement to engage responsibly to respect the privacy of other participants and to enter the process voluntarily`}
</p>

<p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#d8d2c6]">
{`Harmonize shall not be used as evidence of fault liability wrongdoing or entitlement by any participant

Participants remain solely responsible for their own decisions actions communications and legal obligations`}
</p>

            <label className="mt-5 flex gap-3 text-sm leading-6 text-[#f4f1ea]">
              <input
                type="checkbox"
                checked={safetyAccepted}
                onChange={(event) => {
  const checked = event.target.checked
  setSafetyAccepted(checked)

  if (checked) {
    window.localStorage.setItem(storageKey, "accepted")
  } else {
    window.localStorage.removeItem(storageKey)
  }
}}
                className="mt-1"
              />
              <span>
  I acknowledge and accept these participation principles
</span>
            </label>
          </div>
        ) : null}

        <Link
          href={canContinue ? `/harmonize/create?mode=${mode}` : "#"}
          aria-disabled={!canContinue}
          className={`mt-8 inline-flex w-fit rounded-full px-6 py-3 text-sm font-medium transition ${
            canContinue
              ? "bg-[#c6a96b] text-black hover:opacity-90"
              : "cursor-not-allowed bg-white/10 text-[#777]"
          }`}
        >
          I acknowledge agree and commit
        </Link>
      </section>
    </main>
  )
}