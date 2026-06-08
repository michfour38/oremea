"use client"

import { cycleStatusMessage } from "@/lib/harmonize/cycle-status"
import { repairQuestions } from "@/lib/harmonize/repair-questions"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function HarmonizeRepairPage({
  params,
}: {
  params: { systemId: string; cycleId: string }
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
const [saving, setSaving] = useState(false)
const [saved, setSaved] = useState(false)
const [error, setError] = useState("")
const [cycleStatus, setCycleStatus] = useState("")

useEffect(() => {
  async function loadCycleStatus() {
    try {
      const response = await fetch(
        `/api/harmonize/cycle/summary?cycleId=${params.cycleId}`,
      )

      const data = await response.json()

      if (response.ok && data.success) {
        setCycleStatus(data.cycle?.status || "")
      }
    } catch {
      // Status warning is helpful but not required.
    }
  }

  loadCycleStatus()
}, [params.cycleId])

  function updateAnswer(key: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function saveRepair() {
    setSaving(true)
    setSaved(false)
    setError("")

    try {
      await fetch("/api/harmonize/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: params.cycleId,
          scope: "shared",
          content: JSON.stringify(answers),
          questionKey: "repair_alignment",
          phase: "repair",
        }),
      })

await fetch("/api/harmonize/cycle/review-due", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ cycleId: params.cycleId }),
})

      setSaved(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving repair.",
      )
    } finally {
      setSaving(false)
    }
  }

  const complete = repairQuestions.every((q) => answers[q.key]?.trim())

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/loop`}
          className="mb-8 text-sm text-[#c6a96b]"
        >
          ← Back to pattern between
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Repair / Alignment
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          What are you willing to practice together?
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          Repair does not require agreement. It requires enough shared
          understanding to choose one small practice.
        </p>

{cycleStatusMessage(cycleStatus) ? (
  <p className="mt-6 rounded-2xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-4 text-sm leading-6 text-[#f4f1ea]">
    {cycleStatusMessage(cycleStatus)}
  </p>
) : null}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="space-y-5">
            {repairQuestions.map((question) => (
              <div key={question.key}>
                <label className="block text-sm leading-6 text-[#f4f1ea]">
                  {question.text}
                </label>

                <textarea
                  value={answers[question.key] || ""}
                  onChange={(event) =>
                    updateAnswer(question.key, event.target.value)
                  }
                  placeholder="Write here..."
                  className="mt-2 min-h-[100px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
                />
              </div>
            ))}
          </div>

          {saved ? (
            <p className="mt-4 text-sm text-[#c6a96b]">
              Repair practice saved.
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveRepair}
              disabled={saving || !complete}
              className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save repair practice"}
            </button>

            <Link
              href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/review`}
              className="rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
            >
              Continue to review
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}