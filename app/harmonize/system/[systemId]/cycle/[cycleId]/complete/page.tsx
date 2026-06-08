"use client"

import { HarmonizeDrawer } from "@/components/harmonize/harmonize-drawer"
import { cycleStatusMessage } from "@/lib/harmonize/cycle-status"
import Link from "next/link"
import { useEffect, useState } from "react"

function outcomeText(outcome?: string) {
  if (outcome === "integration") return "Something appears to have shifted in this cycle."
  if (outcome === "repetition") return "Something appears to have repeated in this cycle."
  if (outcome === "mimicry") return "The words and the behavior may not be telling the same story yet."
  return "This cycle has been reviewed."
}

export default function HarmonizeCycleCompletePage({
  params,
}: {
  params: { systemId: string; cycleId: string }
}) {
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch(
          `/api/harmonize/cycle/summary?cycleId=${params.cycleId}`,
        )
        const data = await response.json()

        if (response.ok && data.success) {
          setSummary(data.cycle)
        }
      } catch {}
    }

    loadSummary()
  }, [params.cycleId])

  const latestOutcome = summary?.reviews?.[0]?.outcome
const statusMessage = cycleStatusMessage(summary?.status)
const cycleSummary = summary?.systemSnapshot?.cycleSummary

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <HarmonizeDrawer
        systemId={params.systemId}
        cycleId={params.cycleId}
      />
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Cycle Reviewed
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          This cycle has been reviewed.
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          {outcomeText(latestOutcome)}
        </p>

        <p className="mt-4 text-base leading-7 text-[#d8d2c6]">
          Review closes a cycle. The next cycle begins whenever you are willing
          to return with more awareness.
        </p>

{statusMessage ? (
  <p className="mt-6 rounded-2xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-4 text-sm leading-6 text-[#f4f1ea]">
    {statusMessage}
  </p>
) : null}

{cycleSummary ? (
  <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
    <h2 className="text-lg font-medium text-[#f4f1ea]">
      Cycle movement
    </h2>

    <div className="mt-4 space-y-2 text-sm leading-6 text-[#d8d2c6]">
      <p>Ownership appeared {cycleSummary.ownershipCount} time(s).</p>
<p>Possibility appeared {cycleSummary.possibilityCount} time(s).</p>
<p>Fixed wording appeared {cycleSummary.absoluteLanguageCount} time(s).</p>
<p>Containment was needed {cycleSummary.contemptCount} time(s).</p>
<p>Accountability language appeared {cycleSummary.mimicryCount} time(s).</p>
    </div>
  </div>
) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/harmonize/system/${params.systemId}`}
            className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
          >
            Return to system
          </Link>

          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/private`}
            className="rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
          >
            View private cycle
          </Link>

          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`}
            className="rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
          >
            Go to shared repair
          </Link>
        </div>
      </section>
    </main>
  )
}