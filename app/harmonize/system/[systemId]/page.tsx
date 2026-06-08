"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function cycleHref(systemId: string, cycle: any) {
  if (cycle.status === "paused") {
    return `/harmonize/system/${systemId}/cycle/${cycle.id}/pause`
  }

  if (cycle.status === "reviewed") {
    return `/harmonize/system/${systemId}/cycle/${cycle.id}/complete`
  }

  if (cycle.status === "review_due") {
    return `/harmonize/system/${systemId}/cycle/${cycle.id}/review`
  }

  return `/harmonize/system/${systemId}/cycle/${cycle.id}/private`
}

function outcomeText(outcome?: string) {
  if (outcome === "integration") return "Shift noticed"
  if (outcome === "repetition") return "Repetition noticed"
  if (outcome === "mimicry") return "Words and behavior gap noticed"
  if (outcome === "incomplete") return "Incomplete"
  return "Not reviewed yet"
}

export default function HarmonizeSystemPage({
  params,
}: {
  params: { systemId: string }
}) {
  const router = useRouter()
  const [system, setSystem] = useState<any>(null)
const [memory, setMemory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadSystem() {
      try {
        const response = await fetch(
          `/api/harmonize/system/summary?systemId=${params.systemId}`,
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load system")
        }

        setSystem(data.system)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong loading this system.",
        )
      } finally {
        setLoading(false)
      }
    }

    loadSystem()
  }, [params.systemId])

  async function startCycle() {
    setStarting(true)
    setError("")

    try {
      const response = await fetch("/api/harmonize/cycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ systemId: params.systemId }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to start cycle")
      }

      router.push(
        `/harmonize/system/${params.systemId}/cycle/${data.cycle.id}/private`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong starting the cycle.",
      )
    } finally {
      setStarting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-20">
        <Link href="/harmonize" className="mb-8 text-sm text-[#c6a96b]">
          ← Harmonize
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize System
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Your Harmonize space.
        </h1>

        <p className="mt-6 text-sm leading-6 text-[#bfb8aa]">
          System ID: {params.systemId}
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-[#bfb8aa]">Loading...</p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </p>
        ) : null}

{memory ? (
  <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
    <div className="mt-4 space-y-2 text-sm leading-6 text-[#d8d2c6]">
  <p>Total cycles: {memory.totalCycles}</p>
  <p>Reviewed cycles: {memory.reviewedCycles}</p>
  <p>Cycles with visible shift: {memory.integrationCycles}</p>
  <p>Cycles with repetition: {memory.repetitionCycles}</p>
  <p>Cycles with words/behavior gap: {memory.mimicryCycles}</p>
</div>

    <div className="mt-4 space-y-2 text-sm leading-6 text-[#d8d2c6]">
  <p>{memory.totalCycles} cycle(s) have been started in this system.</p>
  <p>{memory.reviewedCycles} cycle(s) have been reviewed.</p>
  <p>Visible shift has appeared in {memory.integrationCycles} reviewed cycle(s).</p>
  <p>Repetition has appeared in {memory.repetitionCycles} reviewed cycle(s).</p>
  <p>A words/behavior gap has appeared in {memory.mimicryCycles} reviewed cycle(s).</p>
</div>
  </div>
) : null}

        {system ? (
          <>
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-medium text-[#f4f1ea]">
                System details
              </h2>

              <div className="mt-4 space-y-2 text-sm leading-6 text-[#d8d2c6]">
                <p>Mode: {system.mode?.replaceAll("_", " ")}</p>
                <p>Status: {system.status}</p>
                <p>Participants: {system.participants?.length || 0}</p>
                <p>Cycles: {system.cycles?.length || 0}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/harmonize/system/${params.systemId}/invite`}
                  className="inline-flex rounded-full border border-[#c6a96b]/40 px-5 py-2 text-sm font-medium text-[#c6a96b]"
                >
                  Invite participants
                </Link>

                <button
                  type="button"
                  onClick={startCycle}
                  disabled={starting}
                  className="inline-flex rounded-full bg-[#c6a96b] px-5 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {starting ? "Starting..." : "Start new cycle"}
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-medium text-[#f4f1ea]">
                Cycles
              </h2>

              {!system.cycles?.length ? (
                <p className="mt-4 text-sm leading-6 text-[#bfb8aa]">
                  No cycles yet.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {system.cycles.map((cycle: any) => (
                    <Link
                      key={cycle.id}
                      href={cycleHref(params.systemId, cycle)}
                      className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#c6a96b]/60 hover:bg-[#c6a96b]/10"
                    >
                      <p className="text-sm font-medium text-[#f4f1ea]">
                        {cycle.title || "Harmonize Cycle"}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[#bfb8aa]">
                        Status: {cycle.status} · Review:{" "}
                        {outcomeText(cycle.reviews?.[0]?.outcome)}
                      </p>

                      <p className="mt-2 text-xs text-[#777]">
                        Started:{" "}
                        {cycle.started_at
                          ? new Date(cycle.started_at).toLocaleString()
                          : "Unknown"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}