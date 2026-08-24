"use client"

import MemberNav from "@/app/(member)/member-nav"
import { HarmonizeDrawer } from "@/components/harmonize/harmonize-drawer"
import { cycleStatusMessage } from "@/lib/harmonize/cycle-status"
import { privateWitnessEngine } from "@/src/lib/harmonize/private-witness-engine"
import Link from "next/link"
import { useEffect, useRef, useState, use } from "react";

type HarmonizeEntry = {
  id: string
  content: string
  prompt_text?: string | null
  created_at: string
}

const OPENING_QUESTION =
  "What feels important enough to bring into this space today?"

export default function HarmonizePrivatePage(
  props: {
    params: Promise<{ systemId: string; cycleId: string }>
  }
) {
  const params = use(props.params);
  const [content, setContent] = useState("")
  const [entries, setEntries] = useState<HarmonizeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [cycleStatus, setCycleStatus] = useState("")
  const [nextQuestion, setNextQuestion] = useState("")
  const [showWitnessFeedback, setShowWitnessFeedback] = useState(false)
  const [witnessFeedback, setWitnessFeedback] = useState("")
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [conversationTitle, setConversationTitle] = useState("Conversation")
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const witness = privateWitnessEngine(entries)

  const currentQuestion =
    entries.length === 0 ? OPENING_QUESTION : nextQuestion

  const witnessLostThread =
    currentQuestion.includes("[Etheric Loop] appears to have lost the thread") ||
    currentQuestion.includes("more complexity than it knew how to follow") ||
    currentQuestion.includes("did not know how to hold well")

  async function loadWitnessQuestion() {
    if (loadingQuestion || entries.length === 0) return

    setLoadingQuestion(true)

    try {
      const response = await fetch("/api/harmonize/witness-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cycleId: params.cycleId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.nextQuestion) {
        setNextQuestion(data.nextQuestion)
        return
      }

      setNextQuestion("")
    } catch {
      setNextQuestion("")
    } finally {
      setLoadingQuestion(false)
    }
  }

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

  async function loadConversationTitle() {
    try {
      const response = await fetch(
        `/api/harmonize/cycle/summary?cycleId=${params.cycleId}`,
      )

      const data = await response.json()

      if (
        response.ok &&
        data.success &&
        data.cycle?.displayTitle
      ) {
        setConversationTitle(data.cycle.displayTitle)
      }
    } catch {
      // Ignore title lookup errors.
    }
  }

  async function saveEntry() {
  if (saving || !content.trim()) return

  setSaving(true)
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
        promptText: currentQuestion,
        phase: "witness",
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to save entry")
    }

    setContent("")
    setNextQuestion("")
    setShowWitnessFeedback(false)
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

  async function saveWitnessFeedback() {
    if (!witnessFeedback.trim()) return

    setSavingFeedback(true)
    setError("")

    try {
      const latestEntry = entries[entries.length - 1]

      const response = await fetch("/api/harmonize/witness-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cycleId: params.cycleId,
          latestAnswer: latestEntry?.content ?? content,
          witnessReply: currentQuestion,
          feedback: witnessFeedback,
          strongestAnchor: witness.anchorDefinition?.anchor ?? null,
          strongestSignal: witness.strongestSignal?.source ?? null,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save witness feedback")
      }

      setWitnessFeedback("")
      setShowWitnessFeedback(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving witness feedback.",
      )
    } finally {
      setSavingFeedback(false)
    }
  }

  useEffect(() => {
  loadEntries()
  loadConversationTitle()

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [params.cycleId])

  useEffect(() => {
    if (!loadingEntries && entries.length > 0) {
      loadWitnessQuestion()
    }

    if (!loadingEntries && entries.length === 0) {
      setNextQuestion("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, loadingEntries])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }, [entries.length, currentQuestion, loadingQuestion])

  return (
  <>
    <MemberNav />

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
  Conversation
</p>

<h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
  {conversationTitle}
</h1>

<p className="mt-3 text-sm uppercase tracking-[0.25em] text-[#8f8778]">
  Private Witness
</p>

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

            {loadingQuestion ? (
              <div className="mr-auto flex max-w-[85%] gap-2 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#c6a96b]" />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-[#c6a96b]"
                  style={{ animationDelay: "0.15s" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-[#c6a96b]"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            ) : null}

            {!loadingEntries && !loadingQuestion && currentQuestion ? (
              <>
                <div className="mr-auto max-w-[85%] whitespace-pre-line rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#d8d2c6]">
                  {currentQuestion}
                </div>

                {witnessLostThread ? (
                  <button
                    type="button"
                    onClick={() =>
                      setShowWitnessFeedback((current) => !current)
                    }
                    className="text-left text-xs text-[#8f8778] underline-offset-4 hover:text-[#c6a96b] hover:underline"
                  >
                    Something important may have been missed. Help Etheric Loop
                    learn from this conversation.
                  </button>
                ) : null}
              </>
            ) : null}

            {showWitnessFeedback ? (
              <div className="rounded-2xl border border-[#c6a96b]/20 bg-black/25 p-4">
                <p className="whitespace-pre-line text-sm leading-6 text-[#d8d2c6]">
                  {`[Etheric Loop] is still learning how to hold complex human patterns.

If something important was missed, misunderstood, or should have been explored further, tell us here.

What did you wish it noticed?
What would you have been curious about next?

Your suggestions help improve future conversations.`}
                </p>

                <textarea
                  value={witnessFeedback}
                  onChange={(event) => setWitnessFeedback(event.target.value)}
                  placeholder="Teach Etheric Loop what it missed..."
                  className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
                />

                <button
                  type="button"
                  onClick={saveWitnessFeedback}
                  disabled={savingFeedback || !witnessFeedback.trim()}
                  className="mt-4 rounded-full bg-[#c6a96b] px-5 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingFeedback ? "Saving..." : "Share insight"}
                </button>
              </div>
            ) : null}

            <div ref={bottomRef} />
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

          <div className="mt-5 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={saveEntry}
              disabled={saving || !content.trim()}
              className="rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save private entry"}
            </button>

            {witness.readyForSharedSpace ? (
              <Link
                href={`/harmonize/system/${params.systemId}/cycle/${params.cycleId}/shared`}
                className="inline-flex items-center rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
              >
                Enter shared space
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </main>
</>
)
}