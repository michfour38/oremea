"use client"

import { HarmonizeDrawer } from "@/components/harmonize/harmonize-drawer"
import { cycleStatusMessage } from "@/lib/harmonize/cycle-status"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function HarmonizeLoopPage({
  params,
}: {
  params: { systemId: string; cycleId: string }
}) {
  const [summary, setSummary] = useState<any>(null)
const [patternBetween, setPatternBetween] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [error, setError] = useState("")
const [cycleStatus, setCycleStatus] = useState("")

  useEffect(() => {
    async function loadLoop() {
      try {
        const response = await fetch(
          `/api/harmonize/shared-loop?cycleId=${params.cycleId}`,
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load loop")
        }

        setSummary(data.summary)
        setEntries(data.entries || [])
const summaryResponse = await fetch(
  `/api/harmonize/cycle/summary?cycleId=${params.cycleId}`,
)

const summaryData = await summaryResponse.json()

if (summaryResponse.ok && summaryData.success) {
  setCycleStatus(summaryData.cycle?.status || "")
}
const patternResponse = await fetch(
  `/api/harmonize/pattern-between?cycleId=${params.cycleId}`,
)

const patternData = await patternResponse.json()

if (patternResponse.ok && patternData.success) {
  setPatternBetween(patternData.patternBetween)
}
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong loading the loop.",
        )
      }
    }

    loadLoop()
  }, [params.cycleId])

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <HarmonizeDrawer
        systemId={params.systemId}
        cycleId={params.cycleId}
      />
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`}
          className="mb-8 text-sm text-[#c6a96b]"
        >
          ← Back to shared repair
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Pattern Between
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          What is happening between you?
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          This view does not expose private reflections. It only shows shared
          repair movement and containment moments from this cycle.
        </p>

{cycleStatusMessage(cycleStatus) ? (
  <p className="mt-6 rounded-2xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-4 text-sm leading-6 text-[#f4f1ea]">
    {cycleStatusMessage(cycleStatus)}
  </p>
) : null}

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </p>
        ) : null}

{patternBetween ? (
  <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
    <h2 className="text-lg font-medium text-[#f4f1ea]">
      Pattern between
    </h2>

    <p className="mt-3 text-base leading-7 text-[#f4f1ea]">
      {patternBetween.patternLabel}
    </p>

    <p className="mt-3 text-sm leading-6 text-[#d8d2c6]">
      {patternBetween.description}
    </p>

    {patternBetween.evidence?.length ? (
      <div className="mt-4 space-y-2">
        {patternBetween.evidence.map((item: string, index: number) => (
          <p key={index} className="text-sm leading-6 text-[#d8d2c6]">
            {item}
          </p>
        ))}
      </div>
    ) : null}
  </div>
) : null}

        {summary ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-medium text-[#f4f1ea]">
              Loop summary
            </h2>

            <div className="mt-4 space-y-2 text-sm leading-6 text-[#d8d2c6]">
              <p>Private reflection entries: {summary.privateEntryCount}</p>
              <p>Shared repair entries: {summary.sharedEntryCount}</p>
              <p>Pause entries: {summary.pauseEntryCount}</p>
              <p>Status: {summary.loopStatus.replaceAll("_", " ")}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
          <h2 className="text-lg font-medium text-[#f4f1ea]">
            Shared movement
          </h2>

          {entries.filter((entry) => entry.scope !== "private").length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[#d8d2c6]">
              No shared movement has been recorded yet.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {entries
                .filter((entry) => entry.scope !== "private")
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
                      {entry.scope}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#d8d2c6]">
                      {entry.content}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`}
            className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
          >
            Return to shared repair
          </Link>

<Link
  href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/repair`}
  className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
>
  Move to repair
</Link>

          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/review`}
            className="rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
          >
            Continue to review
          </Link>
        </div>
      </section>
    </main>
  )
}