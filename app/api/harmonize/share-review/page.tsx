"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react";

export default function HarmonizeShareReviewPage(
  props: {
    params: Promise<{ systemId: string; cycleId: string }>
  }
) {
  const params = use(props.params);
  const router = useRouter()
  const [review, setReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadReview() {
      try {
        const response = await fetch(
          `/api/harmonize/share-review/latest?cycleId=${params.cycleId}`,
        )

        const data = await response.json()

        if (response.ok && data.success) {
          setReview(data.review)
        }
      } catch {
        setError("Unable to load share review.")
      } finally {
        setLoading(false)
      }
    }

    loadReview()
  }, [params.cycleId])

  async function approveAnyway() {
    if (!review?.id) return

    setApproving(true)
    setError("")

    try {
      const response = await fetch("/api/harmonize/share-review/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to approve message")
      }

      router.push(
        `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong approving the message.",
      )
    } finally {
      setApproving(false)
    }
  }

  const reason =
    review?.reason ||
    "This message may need review before shared repair continues."

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Share Review
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Pause before sharing.
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          Harmonize noticed something that may need review before shared repair
          continues.
        </p>

        <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
          <h2 className="text-lg font-medium text-[#f4f1ea]">
            Please review this first
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#d8d2c6]">
            {loading ? "Loading..." : reason}
          </p>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`}
            className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
          >
            Return and edit
          </Link>

          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/private`}
            className="rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
          >
            Move to private reflection
          </Link>

          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/pause`}
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-[#d8d2c6]"
          >
            Enter active pause
          </Link>

          <button
            type="button"
            onClick={approveAnyway}
            disabled={approving || !review?.id}
            className="rounded-full border border-red-500/40 px-6 py-3 text-sm font-medium text-red-200 disabled:opacity-60"
          >
            {approving ? "Approving..." : "Approve anyway"}
          </button>
        </div>
      </section>
    </main>
  )
}