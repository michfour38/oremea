"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, use } from "react";

import { readinessChoices } from "@/lib/harmonize/decisions"
import { getNextQuestion } from "@/lib/harmonize/flow"
import { getQuestionByKey } from "@/lib/harmonize/questions"

export default function HarmonizeQuestionPage(
  props: {
    params: Promise<{ systemId: string; cycleId: string; questionKey: string }>
  }
) {
  const params = use(props.params);
  const router = useRouter()
  const question = getQuestionByKey(params.questionKey)
  const nextQuestion = getNextQuestion(params.questionKey)

  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!question) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
        <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
          <h1 className="text-3xl font-semibold">Question not found.</h1>
          <Link
            href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/private`}
            className="mt-6 text-[#c6a96b]"
          >
            Return to private witness
          </Link>
        </section>
      </main>
    )
  }

  const activeQuestion = question
  const isReadinessQuestion = activeQuestion.key === "private_or_shared"

  function destinationHref(destination: string) {
    if (destination === "shared") {
      return `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`
    }

    if (destination === "review") {
      return `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/review`
    }

    return `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/private`
  }

  async function saveEntry() {
    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/harmonize/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: params.cycleId,
          scope: "private",
          content,
          questionKey: activeQuestion.key,
          phase: activeQuestion.phase,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save response")
      }

      if (nextQuestion) {
        router.push(
          `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/question/${nextQuestion.key}`,
        )
      } else {
        router.push(
          `/harmonize/system/${params.systemId}/cycle/${params.cycleId}/review`,
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving your response.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#f4f1ea]">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/private`}
          className="mb-8 text-sm text-[#c6a96b]"
        >
          ← Private witness
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          {activeQuestion.phase}
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {activeQuestion.text}
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          This answer remains private unless you intentionally choose to bring
          your own words into shared repair.
        </p>

        {isReadinessQuestion ? (
          <div className="mt-8 grid gap-4">
            {readinessChoices.map((choice) => (
              <Link
                key={choice.key}
                href={destinationHref(choice.destination)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#c6a96b]/60 hover:bg-[#c6a96b]/10"
              >
                <h2 className="text-lg font-medium text-[#f4f1ea]">
                  {choice.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#bfb8aa]">
                  {choice.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write privately here..."
              className="mt-8 min-h-[220px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
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
              className="mt-6 inline-flex w-fit rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : nextQuestion
                  ? "Save and continue"
                  : "Save and review"}
            </button>
          </>
        )}
      </section>
    </main>
  )
}