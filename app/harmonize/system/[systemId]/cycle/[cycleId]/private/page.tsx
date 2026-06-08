"use client"

import { cycleStatusMessage } from "@/lib/harmonize/cycle-status"
import { getFirstQuestion } from "@/lib/harmonize/flow"
import Link from "next/link"
import { useEffect, useState } from "react"

type HarmonizeEntry = {
  id: string
  content: string
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
const firstQuestion = getFirstQuestion()

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
  questionKey: "tell_me_what_happened",
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
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href={`/harmonize/system/${params.systemId}`}
          className="mb-8 text-sm text-[#c6a96b]"
        >
          ← Back to system
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Private Witness
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          This space belongs only to you.
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
            EL begins
          </p>

          <p className="mt-4 text-xl leading-8 text-[#f4f1ea]">
  {firstQuestion?.text ?? "Tell me what happened."}
</p>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write privately here..."
            className="mt-6 min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
          />

          {saved ? (
            <p className="mt-4 text-sm text-[#c6a96b]">Saved privately.</p>
          ) : null}

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
            {saving ? "Saving..." : "Save private entry"}
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-medium">Private entries</h2>

          {loadingEntries ? (
            <p className="mt-4 text-sm text-[#bfb8aa]">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="mt-4 text-sm text-[#bfb8aa]">
              No private entries yet.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[#d8d2c6]">
                    {entry.content}
                  </p>
                  <p className="mt-3 text-xs text-[#777]">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
  href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/question/what_stayed_with_you`}
  className="mt-8 inline-flex w-fit rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
>
  Continue privately
</Link>
      </section>
    </main>
  )
}