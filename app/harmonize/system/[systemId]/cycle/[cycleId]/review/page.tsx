"use client"

import { HarmonizeDrawer } from "@/components/harmonize/harmonize-drawer"
import { reviewQuestions } from "@/lib/harmonize/review-questions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type ReviewAnswers = {
  same_within_self: string
  different_within_self: string
  different_in_relationship: string
  observable_response: string
}

const initialAnswers: ReviewAnswers = {
  same_within_self: "",
  different_within_self: "",
  different_in_relationship: "",
  observable_response: "",
}

function movementText(outcome?: string) {
  if (outcome === "integration") {
    return "Something appears to have shifted in this cycle."
  }

  if (outcome === "repetition") {
    return "Something appears to have repeated in this cycle."
  }

  if (outcome === "mimicry") {
    return "The words and the behavior may not be telling the same story yet."
  }

  return "This cycle is still being reviewed."
}

function signalText(type: string) {
  if (type === "absolute_language") {
    return "Some wording may make the experience feel fixed rather than open to repair."
  }

  if (type === "contempt") {
    return "Some language may reduce repair or make another person feel small."
  }

  if (type === "ownership") {
    return "Some ownership language appears to be emerging."
  }

  if (type === "possibility") {
    return "Some possibility language appears to be emerging."
  }

  if (type === "mimicry") {
    return "Some accountability language appeared. Review will later compare words with observable behavior."
  }

  return "A relational signal appears to be present."
}

function evidenceText(item: any) {
  if (item.signal === "ownership") {
    return `Ownership language appeared around “${item.evidence}”.`
  }

  if (item.signal === "possibility") {
    return `Possibility language appeared around “${item.evidence}”.`
  }

  if (item.signal === "absolute_language") {
    return `Fixed language appeared around “${item.evidence}”.`
  }

  return `A signal appeared around “${item.evidence}”.`
}

export default function HarmonizeReviewPage({
  params,
}: {
  params: { systemId: string; cycleId: string }
}) {
  const router = useRouter()

  const [answers, setAnswers] = useState<ReviewAnswers>(initialAnswers)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [cycleSummary, setCycleSummary] = useState<any>(null)

  useEffect(() => {
    async function loadCycleSummary() {
      try {
        const response = await fetch(
          `/api/harmonize/cycle/summary?cycleId=${params.cycleId}`,
        )

        const data = await response.json()

        if (response.ok && data.success) {
          setCycleSummary(data.cycle)
        }
      } catch {
        // Summary is helpful but not required.
      }
    }

    loadCycleSummary()
  }, [params.cycleId])

  function updateAnswer(key: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function saveReview() {
    setSaving(true)
    setSaved(false)
    setError("")

    try {
      const response = await fetch("/api/harmonize/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: params.cycleId,
          newlyVisible: answers.observable_response,
          sameWithinSelf: answers.same_within_self,
          differentWithinSelf: answers.different_within_self,
          differentInSystem: answers.different_in_relationship,
          observableResponse: answers.observable_response,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save review")
      }

      setSaved(true)

      router.push(
        `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/complete`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving your review.",
      )
    } finally {
      setSaving(false)
    }
  }

  const latestOutcome = cycleSummary?.reviews?.[0]?.outcome
  const signals = cycleSummary?.signalSnapshot?.signals || []
  const evidence = cycleSummary?.signalSnapshot?.evidence || []
  const pauseEntrySaved = cycleSummary?.signalSnapshot?.pauseEntrySaved
  const pauseEntryPhase = cycleSummary?.signalSnapshot?.pauseEntryPhase

  const reviewComplete =
    answers.same_within_self.trim() &&
    answers.different_within_self.trim() &&
    answers.different_in_relationship.trim() &&
    answers.observable_response.trim()

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <HarmonizeDrawer
        systemId={params.systemId}
        cycleId={params.cycleId}
      />
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href={`/harmonize/system/${params.systemId}`}
          className="mb-8 text-sm text-[#c6a96b]"
        >
          ← Back to system
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Review
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          This cycle is ready to be reviewed.
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          Review closes a cycle. It does not mean everything is solved. It means
          something has been seen clearly enough to return with more awareness.
        </p>

        {latestOutcome ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-medium text-[#f4f1ea]">
              Review movement
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#d8d2c6]">
              {movementText(latestOutcome)}
            </p>
          </div>
        ) : null}

        {signals.length || pauseEntrySaved || evidence.length ? (
          <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
            <h2 className="text-lg font-medium text-[#f4f1ea]">
              What became visible
            </h2>

            {signals.length ? (
              <div className="mt-4 space-y-2">
                {signals.map((signal: any, index: number) => (
                  <p key={index} className="text-sm leading-6 text-[#d8d2c6]">
                    {signalText(signal.type)}
                  </p>
                ))}
              </div>
            ) : null}

            {pauseEntrySaved ? (
              <p className="mt-4 text-sm leading-6 text-[#d8d2c6]">
                A pause reflection was saved during this cycle.
                {pauseEntryPhase === "pause_reflective"
                  ? " Ownership language may be emerging."
                  : " More private reflection may still be useful."}
              </p>
            ) : null}

            {evidence.length ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-[#f4f1ea]">
                  Evidence noticed:
                </p>

                {evidence.map((item: any, index: number) => (
                  <p key={index} className="text-sm leading-6 text-[#d8d2c6]">
                    {evidenceText(item)}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-medium text-[#f4f1ea]">
            Review questions
          </h2>

          <div className="mt-5 space-y-5">
            {reviewQuestions.map((question) => (
              <div key={question.key}>
                <label className="block text-sm leading-6 text-[#f4f1ea]">
                  {question.text}
                </label>

                <textarea
                  value={answers[question.key as keyof ReviewAnswers] || ""}
                  onChange={(event) =>
                    updateAnswer(question.key, event.target.value)
                  }
                  placeholder="Write privately here..."
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
                />
              </div>
            ))}
          </div>

          {saved ? (
            <p className="mt-4 text-sm text-[#c6a96b]">
              Review saved. This cycle has been marked reviewed.
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
              onClick={saveReview}
              disabled={saving || !reviewComplete}
              className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save review"}
            </button>

            <Link
              href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`}
              className="rounded-full border border-[#c6a96b]/40 px-6 py-3 text-sm font-medium text-[#c6a96b]"
            >
              Move to shared repair
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}