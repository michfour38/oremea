"use client"

import { HarmonizeDrawer } from "@/components/harmonize/harmonize-drawer"
import { detectPauseReadiness } from "@/lib/harmonize/pause-signals"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function HarmonizePausePage({
  params,
}: {
  params: { systemId: string; cycleId: string }
}) {
  const router = useRouter()
  const [reopening, setReopening] = useState(false)
  const [pauseReason, setPauseReason] = useState("")
  const [riskType, setRiskType] = useState("")
  const [reflection, setReflection] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
const [appearsReflective, setAppearsReflective] = useState(false)

  useEffect(() => {
    async function markPaused() {
      try {
        await fetch("/api/harmonize/pause", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycleId: params.cycleId }),
        })
      } catch {}
    }

    async function loadPauseReason() {
      try {
        const response = await fetch(
          `/api/harmonize/share-review/latest?cycleId=${params.cycleId}`,
        )

        const data = await response.json()

        if (response.ok && data.success && data.review) {
          setPauseReason(data.review.reason || "")
          setRiskType(data.review.risk_type || "")
        }
      } catch {}
    }

    markPaused()
    loadPauseReason()
  }, [params.cycleId])

  async function savePauseReflection() {
    setSaving(true)
    setSaved(false)

const readiness = detectPauseReadiness(reflection)
setAppearsReflective(readiness.appearsReflective)

    try {
      await fetch("/api/harmonize/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  cycleId: params.cycleId,
  scope: "pause",
  content: reflection,
  questionKey: "pause_reflection",
  phase: readiness.appearsReflective
    ? "pause_reflective"
    : "pause_unresolved",
}),
      })

      setReflection("")
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function returnToShared() {
    setReopening(true)

    try {
      await fetch("/api/harmonize/reopen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId: params.cycleId }),
      })
    } finally {
      router.push(
        `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`,
      )
    }
  }

  const message =
    riskType === "contempt"
      ? "It appears this message may contain contempt, ridicule, or language that could make another person feel small."
      : riskType === "personal_data"
        ? "It appears this message may contain personal information that may be difficult to retract once shared."
        : riskType === "absolute_language"
          ? "It appears this message may be expressing pain through a fixed conclusion."
          : pauseReason ||
            "This is not punishment. It is containment. Shared repair can reopen after each participant has had space to return privately."

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <HarmonizeDrawer
        systemId={params.systemId}
        cycleId={params.cycleId}
      />
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Active Pause
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Let&apos;s pause the shared space.
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">{message}</p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xl leading-8 text-[#f4f1ea]">
            What do you need to understand within yourself before returning to
            shared repair?
          </p>

          <textarea
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder="Write privately here..."
            className="mt-6 min-h-[160px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
          />

          {saved ? (
  <div className="mt-4 space-y-2">
    <p className="text-sm text-[#c6a96b]">
      Pause reflection saved privately.
    </p>

    <p className="text-sm leading-6 text-[#d8d2c6]">
      {appearsReflective
        ? "Ownership appears to be emerging."
        : "You may wish to continue privately before returning to shared repair."}
    </p>
  </div>
) : null}

{!saved ? (
  <p className="mt-4 text-sm leading-6 text-[#bfb8aa]">
    Shared repair stays paused until you save a private reflection.
  </p>
) : null}

          <button
            type="button"
            onClick={savePauseReflection}
            disabled={saving || !reflection.trim()}
            className="mt-5 rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save pause reflection"}
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/private`}
            className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
          >
            Continue privately
          </Link>

          <button
            type="button"
            onClick={returnToShared}
            disabled={reopening || !saved}
            className="rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b] disabled:opacity-60"
          >
            {reopening
  ? "Reopening..."
  : saved
    ? "Return to shared repair"
    : "Save reflection before returning"}
          </button>
        </div>
      </section>
    </main>
  )
}