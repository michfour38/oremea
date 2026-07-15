"use client"

import MemberNav from "@/app/(member)/member-nav"
import ParticipantForm from "@/components/harmonize/ParticipantForm"
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

function modeLabel(mode?: string) {
  if (mode === "couple") return "Couple"
  if (mode === "family_adults") return "Family Adults"
  if (mode === "team") return "Team"
  if (mode === "parallel_parenting_adults") {
    return "Parallel Parenting"
  }

  return "Harmonize"
}

const TITLE_SUGGESTIONS = [
  "Trust",
  "Communication",
  "Boundaries",
  "Responsibility",
  "Repair",
  "Intimacy",
  "Parenting",
  "Money",
  "Feeling Chosen",
  "Betrayal",
]

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
  const [cycleTitle, setCycleTitle] = useState("")
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)

const waitingCycles =
  system?.cycles?.filter(
    (cycle: any) => !cycle.hasPrivateWitness,
  ) ?? []

const canStartAnotherConversation =
  waitingCycles.length === 0

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
    setMemory(data.memory)
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong loading this container.",
    )
  } finally {
    setLoading(false)
  }
}

async function copyInviteLink(inviteId: string) {
  const inviteLink =
    `${window.location.origin}/harmonize/join/${params.systemId}`

  try {
    await navigator.clipboard.writeText(inviteLink)
    setCopiedInviteId(inviteId)
  } catch {
    setError("Unable to copy the invitation link.")
  }
}

useEffect(() => {
  loadSystem()
}, [params.systemId])

  async function startCycle() {
    if (starting) return

    setStarting(true)
    setError("")

    try {
      const response = await fetch("/api/harmonize/cycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemId: params.systemId,
          title: cycleTitle.trim() || "Untitled Conversation",
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to begin conversation")
      }

      router.push(
        `/harmonize/system/${params.systemId}/cycle/${data.cycle.id}/private`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong beginning this conversation.",
      )
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      <MemberNav />

      <main
        className="min-h-screen text-[#f4f1ea]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.74), rgba(0,0,0,0.74)), url('/images/harmonize/bg-harmonize-private.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <section className="mx-auto max-w-5xl px-6 py-20">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
            Harmonize by Oremea
          </p>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
  {system?.name || modeLabel(system?.mode)}
</h1>

{system?.name ? (
  <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
    {modeLabel(system.mode)}
  </p>
) : null}

          <p className="mt-6 max-w-3xl text-base leading-7 text-[#d8d2c6]">
            This is your shared Relationship Space. Private witness remains private.
Conversations are held inside this Relationship Space. Shared space only
            becomes meaningful when participants choose to bring something
            forward.
          </p>

          {loading ? (
            <p className="mt-8 text-sm text-[#bfb8aa]">
              Loading Relationship Space...
            </p>
          ) : null}

          {error ? (
            <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {system ? (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
                    Participants
                  </p>
                  <p className="mt-4 text-3xl font-semibold">
                    {system.participants?.length || 0}
                  </p>
                  <p className="mt-2 text-sm text-[#d8d2c6]">
                    People currently connected to this Relationship Space.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
                    Conversations
                  </p>
                  <p className="mt-4 text-3xl font-semibold">
                    {system.cycles?.length || 0}
                  </p>
                  <p className="mt-2 text-sm text-[#d8d2c6]">
                    Shared threads inside this relationship space.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
                    Relationship Space
                  </p>
                  <p className="mt-4 text-3xl font-semibold capitalize">
                    {system.status}
                  </p>
                  <p className="mt-2 text-sm text-[#d8d2c6]">
                    This Relationship Space remains active while participants continue using it.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-medium text-[#f4f1ea]">
                      Participants
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
                      Everyone listed below belongs to this Relationship Space.
Creating the Relationship Space is simply an administrative action and gives no additional authority inside the conversation. Every participant's private witness remains private unless they intentionally choose to share it.
                    </p>
                  </div>

                  <button
  type="button"
  onClick={() => setShowInvitePanel((value) => !value)}
  className="rounded-full border border-[#c6a96b]/40 px-5 py-2 text-sm font-medium text-[#c6a96b]"
>
  Add participant
</button>
                </div>

                <div className="mt-5 space-y-3">
                  {system.participants?.map((participant: any) => (
                    <div
                      key={participant.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center gap-2">
  <span
    className={
      participant.isPending
        ? "text-[#8f8778]"
        : "text-[#c6a96b]"
    }
  >
    {participant.isPending ? "○" : "✓"}
  </span>

  <p className="text-sm font-medium text-[#f4f1ea]">
    {participant.displayName}
  </p>
</div>

                      <p className="mt-1 text-xs text-[#8f8778]">
  {participant.isOwner
    ? "Relationship Space Creator · Joined"
    : participant.isPending
      ? "Invitation pending"
      : "Joined"}
</p>

                      {participant.relationshipContext ? (
                        <p className="mt-2 text-xs text-[#c6a96b]">
                          {participant.relationshipContext}
                        </p>
                      ) : null}

{participant.isPending ? (
  <button
    type="button"
    onClick={() => copyInviteLink(participant.id)}
    className="mt-4 rounded-full border border-[#c6a96b]/40 px-4 py-2 text-xs font-medium text-[#c6a96b]"
  >
    {copiedInviteId === participant.id
      ? "Invite link copied"
      : "Copy invite link"}
  </button>
) : null}

                    </div>
                  ))}
                </div>
              </div>

{showInvitePanel ? (
  <ParticipantForm
  systemId={params.systemId}
  onSaved={async () => {
  await loadSystem()
}}
/>
) : null}

                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
  <h2 className="text-lg font-medium text-[#f4f1ea]">
    Relationship Memory
  </h2>

  <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
    What has become visible across completed conversations in this
    Relationship Space.
  </p>

  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
        Conversations
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#f4f1ea]">
        {memory?.totalCycles || 0}
      </p>
    </div>

    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
        Integrated
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#f4f1ea]">
        {memory?.integrationCycles || 0}
      </p>
    </div>

    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
        Repeating
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#f4f1ea]">
        {memory?.repetitionCycles || 0}
      </p>
    </div>

    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
        Words / behaviour gap
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#f4f1ea]">
        {memory?.mimicryCycles || 0}
      </p>
    </div>
  </div>
</div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-medium text-[#f4f1ea]">
                  Conversations in this Relationship Space
                </h2>

                {!system.cycles?.length ? (
                  <p className="mt-4 text-sm leading-6 text-[#bfb8aa]">
                    No conversations have been started yet.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {system.cycles.map((cycle: any, index: number) => (
                      <Link
                        key={cycle.id}
                        href={cycleHref(params.systemId, cycle)}
                        className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#c6a96b]/60 hover:bg-[#c6a96b]/10"
                      >
                        <p className="text-sm font-medium text-[#f4f1ea]">
                          {cycle.hasPrivateWitness
                            ? cycle.displayTitle
                            : `Conversation ${index + 1}`}
                        </p>

                        {cycle.hasPrivateWitness ? (
                          <p className="mt-2 text-xs text-[#777]">
                            Continue your private witness.
                          </p>
                        ) : (
                          <>
                            <p className="mt-2 text-xs text-[#777]">
                              Another participant has started this conversation.
                            </p>

                            <p className="mt-2 text-xs text-[#c6a96b]">
                              Begin your private witness.
                            </p>
                          </>
                        )}

                        <p className="mt-3 text-[11px] text-[#666]">
                          Started{" "}
                          {cycle.started_at
                            ? new Date(cycle.started_at).toLocaleString()
                            : "Unknown"}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {canStartAnotherConversation ? (
  <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
    <h2 className="text-lg font-medium text-[#f4f1ea]">
      Start another conversation
    </h2>

    <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
      Begin a new shared thread when this relationship is ready to explore a
      different topic. Existing conversations remain available to return to at
      any time.
    </p>

    <input
      value={cycleTitle}
      onChange={(event) => setCycleTitle(event.target.value)}
      placeholder="What would you call this conversation?"
      className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
    />

    <div className="mt-3 flex flex-wrap gap-2">
      {TITLE_SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => setCycleTitle(suggestion)}
          className="rounded-full border border-[#c6a96b]/30 px-3 py-1 text-xs text-[#c6a96b] transition hover:bg-[#c6a96b]/10"
        >
          {suggestion}
        </button>
      ))}
    </div>

    <button
      type="button"
      onClick={startCycle}
      disabled={starting}
      className="mt-5 inline-flex rounded-full bg-[#c6a96b] px-5 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
    >
      {starting ? "Beginning..." : "+ Start another conversation"}
    </button>
  </div>
) : (
  <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
    <h2 className="text-lg font-medium text-[#f4f1ea]">
      Waiting for your participation
    </h2>

    <p className="mt-3 text-sm leading-6 text-[#d8d2c6]">
      There {waitingCycles.length === 1 ? "is" : "are"}{" "}
      {waitingCycles.length} conversation
      {waitingCycles.length === 1 ? "" : "s"} waiting for your private
      witness.

      Complete your participation before starting another conversation.
    </p>

    <Link
      href={cycleHref(params.systemId, waitingCycles[0])}
      className="mt-6 inline-flex rounded-full bg-[#c6a96b] px-5 py-2 text-sm font-medium text-black"
    >
      Go to next conversation
    </Link>
  </div>
)}
            </>
          ) : null}
        </section>
      </main>
    </>
  )
}