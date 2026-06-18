"use client"

import { buildLiveWitnessSessionState } from "@/src/lib/harmonize/witness-live-state"
import { HarmonizeDrawer } from "@/components/harmonize/harmonize-drawer"
import { WitnessEmergencePanel } from "@/src/components/harmonize/WitnessEmergencePanel"
import { cycleStatusMessage } from "@/lib/harmonize/cycle-status"
import { privateWitnessEngine } from "@/src/lib/harmonize/private-witness-engine"
import { buildWitnessMeaningPanelModel } from "@/src/lib/harmonize/witness-meaning-panel-model"
import Link from "next/link"
import { useEffect, useState } from "react"

type HarmonizeEntry = {
  id: string
  content: string
  prompt_text?: string | null
  created_at: string
}

export default function HarmonizePrivatePage({
  params,
}: {
  params: { systemId: string; cycleId: string }
}) {
  const [content, setContent] = useState("")
  const [entries, setEntries] = useState<HarmonizeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [cycleStatus, setCycleStatus] = useState("")

  const witness = privateWitnessEngine(entries)

  const meaningPanelModel = buildWitnessMeaningPanelModel(
  buildLiveWitnessSessionState({
    cycleId: params.cycleId,
    anchorDefinition: witness.anchorDefinition,
    strongestSignal: witness.strongestSignal,
    nextQuestion: witness.nextQuestion,
    readyForSharedSpace: witness.readyForSharedSpace,
  }),
)

  async function loadEntries() {
    setLoadingEntries(true)

    try {
      const response = await fetch(
        `/api/harmonize/entries?cycleId=${params.cycleId}`,
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load entries")
      }

      setEntries(data.entries || [])

      const summaryResponse = await fetch(
        `/api/harmonize/cycle/summary?cycleId=${params.cycleId}`,
      )
      const summaryData = await summaryResponse.json()

      if (summaryResponse.ok && summaryData.success) {
        setCycleStatus(summaryData.cycle.status)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading your entries.",
      )
    } finally {
      setLoadingEntries(false)
    }
  }

  async function saveEntry() {
    setSaving(true)
    setSaved(false)
    setError("")

    try {
      const response = await fetch("/api/harmonize/entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cycleId: params.cycleId,
          scope: "private",
          content,
          questionKey: "private_witness",
          promptText: witness.nextQuestion,
          phase: "witness",
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save entry")
      }

      setContent("")
      setSaved(true)
      await loadEntries()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving your entry.",
      )
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.cycleId])

  return (
    <main
      className="min-h-screen text-[#f4f1ea]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.76), rgba(0,0,0,0.76)), url('/images/harmonize/bg-harmonize-private.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <HarmonizeDrawer systemId={params.systemId} cycleId={params.cycleId} />

      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          This space belongs only to you
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          Nothing written here is automatically shared. Harmonize begins by
          witnessing what happened, without forcing repair too soon.
        </p>

        {cycleStatusMessage(cycleStatus) ? (
          <p className="mt-6 rounded-2xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-4 text-sm leading-6 text-[#f4f1ea]">
            {cycleStatusMessage(cycleStatus)}
          </p>
        ) : null}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-[#c6a96b]">
            Private Witness
          </p>

          <div className="mt-6 space-y-4">
            {loadingEntries ? (
              <p className="text-sm text-[#bfb8aa]">
                Loading private witness...
              </p>
            ) : null}

            {entries.map((entry) => (
              <div key={entry.id} className="space-y-3">
                {entry.prompt_text ? (
                  <div className="mr-auto max-w-[85%] rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#d8d2c6]">
                    {entry.prompt_text}
                  </div>
                ) : null}

                <div className="ml-auto max-w-[85%] rounded-2xl border border-[#c6a96b]/20 bg-[#c6a96b]/10 p-4 text-sm leading-6 text-[#f4f1ea]">
                  {entry.content}
                </div>
              </div>
            ))}

            <div className="mr-auto max-w-[85%] rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#d8d2c6]">
              {witness.nextQuestion}
            </div>
          </div>

          <div className="mt-8">
            <WitnessEmergencePanel model={meaningPanelModel} />
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Reply..."
            className="mt-6 min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
          />

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={saveEntry}
            disabled={saving || !content.trim()}
            className="mt-5 rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save private entry"}
          </button>

          {saved ? (
            <p className="mt-4 text-sm text-[#bfb8aa]">
              Saved. The witness trail has been updated.
            </p>
          ) : null}

          {witness.readyForSharedSpace ? (
            <Link
              href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`}
              className="mt-6 inline-flex rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
            >
              Enter shared space
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  )
}