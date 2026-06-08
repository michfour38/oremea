"use client"

import { HarmonizeDrawer } from "@/components/harmonize/harmonize-drawer"
import { cycleStatusMessage } from "@/lib/harmonize/cycle-status"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function HarmonizeSharedPage({
  params,
}: {
  params: { systemId: string; cycleId: string }
}) {
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [warning, setWarning] = useState("")
  const [error, setError] = useState("")
  const [cycleStatus, setCycleStatus] = useState("")

  const router = useRouter()

  useEffect(() => {
    async function checkCycleStatus() {
      try {
        const response = await fetch(
          `/api/harmonize/cycle/summary?cycleId=${params.cycleId}`,
        )

        const data = await response.json()

        if (response.ok && data.success) {
          setCycleStatus(data.cycle?.status || "")
        }

        if (response.ok && data.success && data.cycle?.status === "paused") {
          router.push(
            `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/share-review`,
          )
        }
      } catch {
        // Shared page still renders if status check fails.
      }
    }

    checkCycleStatus()
  }, [params.cycleId, params.systemId, router])

  async function saveSharedEntry() {
    setSaving(true)
    setSaved(false)
    setWarning("")
    setError("")

    try {
      const response = await fetch("/api/harmonize/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: params.cycleId,
          scope: "shared",
          content,
          questionKey: "shared_repair",
          phase: "shared",
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save shared entry")
      }

      if (data.entry?.requires_review_before_send) {
        setWarning(
          data.shareReview?.reason ||
            "This message has been saved for review before shared repair continues.",
        )

        router.push(
          `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/share-review`,
        )
      } else {
        setSaved(true)
        setContent("")
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving your shared entry.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <HarmonizeDrawer
        systemId={params.systemId}
        cycleId={params.cycleId}
      />

      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/private`}
          className="mb-8 text-sm text-[#c6a96b]"
        >
          ← Back to private
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Shared Repair
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Shared repair is chosen, not extracted.
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          This space is for repair, understanding, and practice. Private
          reflections remain private unless each participant chooses their own
          words to bring forward.
        </p>

        {cycleStatusMessage(cycleStatus) ? (
          <p className="mt-6 rounded-2xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-4 text-sm leading-6 text-[#f4f1ea]">
            {cycleStatusMessage(cycleStatus)}
          </p>
        ) : null}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xl leading-8 text-[#f4f1ea]">
            What would you like to bring into shared repair in your own words?
          </p>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write only what you intentionally want to bring into shared repair..."
            className="mt-6 min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
          />

          {saved ? (
            <p className="mt-4 text-sm text-[#c6a96b]">
              Shared entry saved.
            </p>
          ) : null}

          {warning ? (
            <p className="mt-4 rounded-2xl border border-[#c6a96b]/40 bg-[#c6a96b]/10 p-4 text-sm leading-6 text-[#f4f1ea]">
              {warning}
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={saveSharedEntry}
            disabled={saving || !content.trim()}
            className="mt-5 rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save shared entry"}
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/loop`}
            className="rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
          >
            View pattern between
          </Link>

          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/review`}
            className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
          >
            Continue to review
          </Link>
        </div>
      </section>
    </main>
  )
}