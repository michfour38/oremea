"use client"

import MemberNav from "@/app/(member)/member-nav"
import ParticipantForm from "@/components/harmonize/ParticipantForm"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react";

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

  if (mode === "family_adults") {
    return "Family Adults"
  }

  if (mode === "team") return "Team"

  if (mode === "parallel_parenting_adults") {
    return "Parallel Parenting"
  }

  return "Harmonize"
}

function formatInviteExpiry(value?: string | null) {
  if (!value) return null

  const expiryDate = new Date(value)

  if (Number.isNaN(expiryDate.getTime())) {
    return null
  }

  return expiryDate.toLocaleDateString()
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

export default function HarmonizeSystemPage(
  props: {
    params: Promise<{
      systemId: string
    }>
  }
) {
  const params = use(props.params);
  const router = useRouter()

  const [system, setSystem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState("")
  const [cycleTitle, setCycleTitle] = useState("")

  const [showInvitePanel, setShowInvitePanel] =
    useState(false)

  const [copiedInviteId, setCopiedInviteId] =
    useState<string | null>(null)

  const [revokingInviteId, setRevokingInviteId] =
    useState<string | null>(null)

  const participants =
    system?.participants ?? []

  const pendingInvitations =
    system?.pendingInvitations ?? []

  const currentParticipant =
    participants.find(
      (participant: any) =>
        participant.isCurrentUser,
    ) ?? null

  const isOwner = Boolean(
    currentParticipant?.isOwner,
  )

  const waitingCycles =
    system?.cycles?.filter(
      (cycle: any) =>
        cycle.status !== "archived" &&
        !cycle.hasPrivateWitness,
    ) ?? []

  const activeCycles =
    system?.cycles?.filter(
      (cycle: any) =>
        cycle.status !== "archived",
    ) ?? []

  const canStartAnotherConversation =
    waitingCycles.length === 0

  const participantLimit =
    system?.mode === "couple" ||
    system?.mode ===
      "parallel_parenting_adults"
      ? 2
      : null

  const participantCount =
    system?.participantCount ??
    participants.length

  const pendingInvitationCount =
    system?.pendingInvitationCount ??
    pendingInvitations.length

  const occupiedPlaceCount =
    system?.occupiedPlaceCount ??
    participantCount +
      pendingInvitationCount

  const canAddParticipant =
    isOwner &&
    (participantLimit === null ||
      occupiedPlaceCount < participantLimit)

  const hasExistingConversation =
    activeCycles.length > 0

  const startConversationLabel =
    hasExistingConversation
      ? "Start another conversation"
      : "Start conversation"

  async function loadSystem() {
    try {
      setError("")

      const response = await fetch(
        `/api/harmonize/system/summary?systemId=${params.systemId}`,
        {
          cache: "no-store",
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to load Relationship Space",
        )
      }

      setSystem(data.system)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading this Relationship Space.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSystem()
  }, [params.systemId])

  async function copyInviteLink(
    inviteId: string,
  ) {
    setError("")

    const inviteLink =
      `${window.location.origin}` +
      `/harmonize/join/${params.systemId}` +
      `?invite=${encodeURIComponent(inviteId)}`

    try {
      await navigator.clipboard.writeText(
        inviteLink,
      )

      setCopiedInviteId(inviteId)
    } catch {
      setError(
        "Unable to copy the invitation link.",
      )
    }
  }

  async function revokeInvitation(
    inviteId: string,
  ) {
    if (revokingInviteId) return

    const confirmed = window.confirm(
      "Revoke this invitation? The current invitation link will stop working.",
    )

    if (!confirmed) return

    setRevokingInviteId(inviteId)
    setError("")

    try {
      const response = await fetch(
        "/api/harmonize/invite",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            inviteId,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to revoke this invitation.",
        )
      }

      if (copiedInviteId === inviteId) {
        setCopiedInviteId(null)
      }

      await loadSystem()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong revoking this invitation.",
      )
    } finally {
      setRevokingInviteId(null)
    }
  }

  async function startCycle() {
    if (starting) return

    setStarting(true)
    setError("")

    try {
      const response = await fetch(
        "/api/harmonize/cycle",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            systemId: params.systemId,
            title:
              cycleTitle.trim() ||
              "Untitled Conversation",
          }),
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to begin conversation",
        )
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
            {system?.name ||
              modeLabel(system?.mode)}
          </h1>

          {system?.name ? (
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
              {modeLabel(system.mode)}
            </p>
          ) : null}

          <p className="mt-6 max-w-3xl text-base leading-7 text-[#d8d2c6]">
            This is your shared Relationship Space.
            Private Witness remains private.
            Conversations are held inside this
            Relationship Space. Shared space only
            becomes meaningful when participants
            choose to bring something forward.
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
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
                    Participants
                  </p>

                  <p className="mt-4 text-3xl font-semibold">
                    {participantCount}
                  </p>

                  <p className="mt-2 text-sm text-[#d8d2c6]">
                    People who have joined this
                    Relationship Space.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
                    Pending invitations
                  </p>

                  <p className="mt-4 text-3xl font-semibold">
                    {pendingInvitationCount}
                  </p>

                  <p className="mt-2 text-sm text-[#d8d2c6]">
                    Invitations awaiting the
                    recipient&apos;s choice.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
                    Conversations
                  </p>

                  <p className="mt-4 text-3xl font-semibold">
                    {activeCycles.length}
                  </p>

                  <p className="mt-2 text-sm text-[#d8d2c6]">
                    Shared threads inside this
                    Relationship Space.
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
                    This Relationship Space remains
                    active while participants
                    continue using it.
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
                      Everyone listed here has
                      actively joined this
                      Relationship Space. Creating
                      the Relationship Space is an
                      administrative action and
                      gives no additional authority
                      inside the conversation.
                      Every participant&apos;s
                      Private Witness remains
                      private unless they
                      intentionally choose to share
                      it.
                    </p>
                  </div>

                  {canAddParticipant ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowInvitePanel(
                          (value) => !value,
                        )
                      }
                      className="rounded-full border border-[#c6a96b]/40 px-5 py-2 text-sm font-medium text-[#c6a96b]"
                    >
                      {showInvitePanel
                        ? "Close"
                        : "Add participant"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {participants.length ? (
                    participants.map(
                      (participant: any) => (
                        <div
                          key={participant.id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[#c6a96b]">
                              ✓
                            </span>

                            <p className="text-sm font-medium text-[#f4f1ea]">
                              {
                                participant.displayName
                              }
                            </p>
                          </div>

                          <p className="mt-1 text-xs text-[#8f8778]">
                            {participant.isOwner
                              ? "Relationship Space Creator · Joined"
                              : "Joined"}
                          </p>

                          {participant.relationshipContext ? (
                            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8778]">
                                Relationship context
                              </p>

                              <p className="mt-2 text-xs leading-5 text-[#c6a96b]">
                                {
                                  participant.relationshipContext
                                }
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-[#bfb8aa]">
                      No participants have joined
                      this Relationship Space.
                    </p>
                  )}
                </div>
              </div>

              {isOwner &&
              pendingInvitations.length > 0 ? (
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <h2 className="text-lg font-medium text-[#f4f1ea]">
                    Pending invitations
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
                    These people have been offered
                    access but have not joined.
                    Invitation does not make someone
                    a participant. Participation
                    begins only when they choose to
                    join.
                  </p>

                  <div className="mt-5 space-y-3">
                    {pendingInvitations.map(
                      (invitation: any) => {
                        const expiresOn =
                          formatInviteExpiry(
                            invitation.expiresAt,
                          )

                        return (
                          <div
                            key={invitation.id}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[#8f8778]">
                                ○
                              </span>

                              <p className="break-all text-sm font-medium text-[#f4f1ea]">
                                {invitation.email}
                              </p>
                            </div>

                            <p className="mt-1 text-xs text-[#8f8778]">
                              Invitation pending
                            </p>

                            {invitation.relationshipContext ? (
                              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8778]">
                                  Relationship
                                  context
                                </p>

                                <p className="mt-2 text-xs leading-5 text-[#c6a96b]">
                                  {
                                    invitation.relationshipContext
                                  }
                                </p>
                              </div>
                            ) : null}

                            {expiresOn ? (
                              <p className="mt-3 text-xs text-[#8f8778]">
                                Invitation expires{" "}
                                {expiresOn}
                              </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  copyInviteLink(
                                    invitation.id,
                                  )
                                }
                                className="rounded-full border border-[#c6a96b]/40 px-4 py-2 text-xs font-medium text-[#c6a96b]"
                              >
                                {copiedInviteId ===
                                invitation.id
                                  ? "Invite link copied"
                                  : "Copy invite link"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  revokeInvitation(
                                    invitation.id,
                                  )
                                }
                                disabled={
                                  revokingInviteId ===
                                  invitation.id
                                }
                                className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-medium text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {revokingInviteId ===
                                invitation.id
                                  ? "Revoking..."
                                  : "Revoke invitation"}
                              </button>
                            </div>
                          </div>
                        )
                      },
                    )}
                  </div>
                </div>
              ) : null}

              {canAddParticipant &&
              showInvitePanel ? (
                <ParticipantForm
                  systemId={params.systemId}
                  onSaved={async () => {
                    setShowInvitePanel(false)
                    await loadSystem()
                  }}
                />
              ) : null}

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-medium text-[#f4f1ea]">
                  Conversations in this Relationship
                  Space
                </h2>

                {!activeCycles.length ? (
                  <p className="mt-4 text-sm leading-6 text-[#bfb8aa]">
                    No conversations have been
                    started yet.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {activeCycles.map(
                      (
                        cycle: any,
                        index: number,
                      ) => (
                        <Link
                          key={cycle.id}
                          href={cycleHref(
                            params.systemId,
                            cycle,
                          )}
                          className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#c6a96b]/60 hover:bg-[#c6a96b]/10"
                        >
                          <p className="text-sm font-medium text-[#f4f1ea]">
                            {cycle.hasPrivateWitness
                              ? cycle.displayTitle
                              : `Conversation ${
                                  index + 1
                                }`}
                          </p>

                          {cycle.hasPrivateWitness ? (
                            <p className="mt-2 text-xs text-[#777]">
                              Continue your Private
                              Witness.
                            </p>
                          ) : (
                            <>
                              <p className="mt-2 text-xs text-[#777]">
                                Another participant
                                has started this
                                conversation.
                              </p>

                              <p className="mt-2 text-xs text-[#c6a96b]">
                                Begin your Private
                                Witness.
                              </p>
                            </>
                          )}

                          <p className="mt-3 text-[11px] text-[#666]">
                            Started{" "}
                            {cycle.started_at
                              ? new Date(
                                  cycle.started_at,
                                ).toLocaleString()
                              : "Unknown"}
                          </p>
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </div>

              {canStartAnotherConversation ? (
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <h2 className="text-lg font-medium text-[#f4f1ea]">
                    {startConversationLabel}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
                    Begin a new shared thread when
                    this relationship is ready to
                    explore a different topic.
                    Existing conversations remain
                    available to return to at any
                    time.
                  </p>

                  <input
                    value={cycleTitle}
                    onChange={(event) =>
                      setCycleTitle(
                        event.target.value,
                      )
                    }
                    placeholder="What would you call this conversation?"
                    className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    {TITLE_SUGGESTIONS.map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() =>
                            setCycleTitle(
                              suggestion,
                            )
                          }
                          className="rounded-full border border-[#c6a96b]/30 px-3 py-1 text-xs text-[#c6a96b] transition hover:bg-[#c6a96b]/10"
                        >
                          {suggestion}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={startCycle}
                    disabled={starting}
                    className="mt-5 inline-flex rounded-full bg-[#c6a96b] px-5 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {starting
                      ? "Beginning..."
                      : startConversationLabel}
                  </button>
                </div>
              ) : (
                <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
                  <h2 className="text-lg font-medium text-[#f4f1ea]">
                    Waiting for your participation
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#d8d2c6]">
                    There{" "}
                    {waitingCycles.length === 1
                      ? "is"
                      : "are"}{" "}
                    {waitingCycles.length}{" "}
                    conversation
                    {waitingCycles.length === 1
                      ? ""
                      : "s"}{" "}
                    waiting for your Private Witness.
                    Complete your participation
                    before starting another
                    conversation.
                  </p>

                  <Link
                    href={cycleHref(
                      params.systemId,
                      waitingCycles[0],
                    )}
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