"use client"

import { cycleStatusMessage } from "@/lib/harmonize/cycle-status"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react";

type AccountabilityRung =
  | "observation"
  | "meaning"
  | "effect"
  | "response"
  | "ownership"
  | "assumption"
  | "acknowledgement"
  | "boundary"
  | "willingness"

type ProtectedTruth = {
  observableEvent: boolean
  painOrImpact: boolean
  accountabilityRequest: boolean
  evidencedPattern: boolean
  boundaryOrConsequence: boolean
  strongLanguagePresent: boolean
}

type ReckoningAssessment = {
  requiresReview: true
  riskLevel: number
  riskType: string
  reason: string
  matchedExcerpt: string | null
  recommendedRung: AccountabilityRung
  nextQuestion: string
  guidance?: string
  protectedTruth: ProtectedTruth
}

function protectedTruthLabels(
  protectedTruth: ProtectedTruth,
): string[] {
  const labels: string[] = []

  if (protectedTruth.observableEvent) {
    labels.push("You described something that happened")
  }

  if (protectedTruth.painOrImpact) {
    labels.push("You named its effect on you")
  }

  if (protectedTruth.accountabilityRequest) {
    labels.push("You asked for accountability")
  }

  if (protectedTruth.evidencedPattern) {
    labels.push("You identified a repeated pattern")
  }

  if (protectedTruth.boundaryOrConsequence) {
    labels.push("You expressed a boundary or consequence")
  }

  if (protectedTruth.strongLanguagePresent) {
    labels.push(
      "Your intensity has not been treated as wrongdoing",
    )
  }

  return labels
}

export default function HarmonizeSharedPage(
  props: {
    params: Promise<{
      systemId: string
      cycleId: string
    }>
  }
) {
  const params = use(props.params);
  const router = useRouter()

  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [cycleStatus, setCycleStatus] = useState("")
  const [reckoning, setReckoning] =
    useState<ReckoningAssessment | null>(null)

  useEffect(() => {
    async function checkCycleStatus() {
      try {
        const response = await fetch(
          `/api/harmonize/cycle/summary?cycleId=${params.cycleId}`,
        )

        const data = await response.json()

        if (response.ok && data.success) {
          const status = data.cycle?.status || ""

          setCycleStatus(status)

          if (status === "paused") {
            router.push(
              `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/share-review`,
            )
          }
        }
      } catch {
        /*
         * The shared page may still render if the status
         * check temporarily fails.
         */
      }
    }

    checkCycleStatus()
  }, [
    params.cycleId,
    params.systemId,
    router,
  ])

  async function saveSharedEntry() {
    if (saving || !content.trim()) {
      return
    }

    setSaving(true)
    setSaved(false)
    setError("")

    try {
      const response = await fetch(
        "/api/harmonize/entry",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cycleId: params.cycleId,
            scope: "shared",
            content,
            questionKey: "shared_repair",
            promptText:
              "What would you like to bring into shared repair in your own words?",
            phase: "shared",
          }),
        },
      )

      const data = await response.json()

      /*
       * This is not a failed save.
       *
       * The participant's draft remains in the textarea,
       * nothing has been shared, and Harmonize returns the
       * rung from which their own reckoning continues.
       */
      if (
        response.status === 422 &&
        data.code === "RECKONING_REQUIRED" &&
        data.assessment
      ) {
        setReckoning(
          data.assessment as ReckoningAssessment,
        )

        return
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to share this entry",
        )
      }

      setSaved(true)
      setContent("")
      setReckoning(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong sharing your entry.",
      )
    } finally {
      setSaving(false)
    }
  }

  const protectedTruth =
    reckoning
      ? protectedTruthLabels(
          reckoning.protectedTruth,
        )
      : []

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
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
          Shared repair is chosen, not extracted
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          This space is for repair, understanding, and
          practice. Private reflections remain private
          unless each participant chooses their own words
          to bring forward.
        </p>

        {cycleStatusMessage(cycleStatus) ? (
          <p className="mt-6 rounded-2xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-4 text-sm leading-6 text-[#f4f1ea]">
            {cycleStatusMessage(cycleStatus)}
          </p>
        ) : null}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xl leading-8 text-[#f4f1ea]">
            What would you like to bring into shared
            repair in your own words?
          </p>

          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value)
              setSaved(false)
              setError("")
            }}
            placeholder="Write only what you intentionally want to bring into shared repair..."
            className="mt-6 min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
          />

          {saved ? (
            <p
              className="mt-4 text-sm text-[#c6a96b]"
              aria-live="polite"
            >
              Your words have entered shared repair
            </p>
          ) : null}

          {reckoning ? (
            <div
              className="mt-6 rounded-3xl border border-[#c6a96b]/40 bg-[#c6a96b]/10 p-5"
              aria-live="polite"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
                This has not been shared
              </p>

              <p className="mt-4 text-sm leading-7 text-[#f4f1ea]">
                Your experience does not need to be
                softened or removed
              </p>

              <p className="mt-3 text-sm leading-7 text-[#d8d2c6]">
                {reckoning.reason}
              </p>

              {reckoning.matchedExcerpt ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#bfb8aa]">
                    Language to examine
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#f4f1ea]">
                    “{reckoning.matchedExcerpt}”
                  </p>
                </div>
              ) : null}

              {protectedTruth.length > 0 ? (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#c6a96b]">
                    What remains protected
                  </p>

                  <div className="mt-3 space-y-2">
                    {protectedTruth.map((truth) => (
                      <p
                        key={truth}
                        className="text-sm leading-6 text-[#d8d2c6]"
                      >
                        {truth}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c6a96b]">
                  Continue from here
                </p>

                <p className="mt-3 text-lg leading-8 text-[#f4f1ea]">
  {reckoning.guidance || reckoning.nextQuestion}
</p>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#bfb8aa]">
                Revise the draft above in your own words
                when you are ready
              </p>
            </div>
          ) : null}

          {error ? (
            <p
              className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
              aria-live="polite"
            >
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={saveSharedEntry}
            disabled={saving || !content.trim()}
            className="mt-5 rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Checking..."
              : reckoning
                ? "Check revised words"
                : "Bring into shared repair"}
          </button>
        </div>

        <Link
          href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/loop`}
          className="mt-8 mr-3 inline-flex w-fit rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
        >
          View pattern between
        </Link>

        <Link
          href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/review`}
          className="mt-8 inline-flex w-fit rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
        >
          Continue to review
        </Link>
      </section>
    </main>
  )
}