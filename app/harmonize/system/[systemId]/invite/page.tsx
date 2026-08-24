"use client"

import ParticipantList from "@/components/harmonize/invite/ParticipantList"
import MemberNav from "@/app/(member)/member-nav"
import InvitationDetails from "@/components/harmonize/invite/InvitationDetails"
import Link from "next/link"
import { useEffect, useState, use } from "react";
import {
  BASE_INCLUDED_PARTICIPANTS,
  BASE_PRICE,
  EXTRA_PARTICIPANT_PRICE,
  SELF_SERVE_MAX_PARTICIPANTS,
  RELATIONSHIP_CONTEXTS,
  type InviteParticipant,
} from "@/components/harmonize/invite/invite-types"

export default function HarmonizeInvitePage(
  props: {
    params: Promise<{ systemId: string }>
  }
) {
  const params = use(props.params);
  const [participants, setParticipants] = useState<InviteParticipant[]>([
    { email: "", relationshipContext: "Partner" },
  ])
  const [copied, setCopied] = useState("")
  const [error, setError] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setInviteLink(`${window.location.origin}/harmonize/join/${params.systemId}`)
  }, [params.systemId])

  const validParticipants = participants.filter(
    (participant) =>
      participant.email.trim() && participant.email.includes("@"),
  )

  const bccList = validParticipants
    .map((participant) => participant.email.trim())
    .join(", ")

  const relationshipLines = validParticipants
    .map(
      (participant) =>
        `${participant.email.trim()} — ${participant.relationshipContext}`,
    )
    .join("\n")

  const subject = "Invitation to join a Harmonize container"

  const body = `I've created a Harmonize container for us.

Harmonize is a structured relational reflection space.
Private reflections remain private.
Shared repair is chosen not extracted.

Your relationship context in this container:
${relationshipLines || "Your role will be confirmed when you join."}

Join here:
${inviteLink}

Please create or sign into your Oremea account before joining.

Harmonize by Oremea`

  const totalParticipants = participants.length + 1
  const extraParticipants = Math.max(
    0,
    totalParticipants - BASE_INCLUDED_PARTICIPANTS,
  )
  const monthlyPrice =
    BASE_PRICE + extraParticipants * EXTRA_PARTICIPANT_PRICE

  const overSelfServeLimit =
    totalParticipants > SELF_SERVE_MAX_PARTICIPANTS

  function addParticipant() {
    setParticipants((current) => [
      ...current,
      { email: "", relationshipContext: "Other" },
    ])
  }

  function removeParticipant(index: number) {
    setParticipants((current) => current.filter((_, i) => i !== index))
  }

  function updateParticipant(
    index: number,
    field: keyof InviteParticipant,
    value: string,
  ) {
    setParticipants((current) => {
      const next = [...current]
      next[index] = {
        ...next[index],
        [field]: value,
      }
      return next
    })
  }

  async function copyText(label: string, text: string) {
    setError("")

    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
    } catch {
      setError("Copy failed. Please select and copy manually.")
    }
  }

  async function saveInvites() {
    setError("")
    setSaved(false)
    setSaving(true)

    try {
      const response = await fetch("/api/harmonize/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemId: params.systemId,
          invites: participants,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to save invites.")
      }

      setSaved(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save invites.",
      )
    } finally {
      setSaving(false)
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
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href={`/harmonize/system/${params.systemId}`}
          className="mb-8 text-sm text-[#c6a96b]"
        >
          ← Back to container
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Invite participants
        </h1>

        <p className="mt-6 whitespace-pre-line text-base leading-7 text-[#d8d2c6]">
          {`Invite people into this container.

Relationship context is not hierarchy. It only helps Harmonize understand how this person is connected to the container.

Private reflections remain private.
Shared repair is chosen, not extracted.`}
        </p>

        <ParticipantList
  participants={participants}
  addParticipant={addParticipant}
  removeParticipant={removeParticipant}
  updateParticipant={updateParticipant}
/>

        <div className="mt-8 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
          <h2 className="text-lg font-medium text-[#f4f1ea]">
            Invitation details
          </h2>

          <div className="mt-5 space-y-5 text-sm leading-6 text-[#d8d2c6]">
            <div>
              <p className="text-[#f4f1ea]">Subject</p>
              <p className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                {subject}
              </p>
            </div>

            <div>
              <p className="text-[#f4f1ea]">BCC</p>
              <p className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                {bccList || "Enter participant emails above"}
              </p>
            </div>

            <div>
              <p className="text-[#f4f1ea]">Message</p>
              <pre className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-4 font-sans text-sm leading-6 text-[#d8d2c6]">
                {body}
              </pre>
            </div>
          </div>

          {overSelfServeLimit ? (
            <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Self-serve containers support up to{" "}
              {SELF_SERVE_MAX_PARTICIPANTS} participants. Larger systems need a
              custom setup.
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {copied ? (
            <p className="mt-4 text-sm text-[#c6a96b]">{copied} copied.</p>
          ) : null}

          <p className="mt-5 text-sm leading-6 text-[#d8d2c6]">
            Estimated monthly total: R{monthlyPrice}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
<button
  type="button"
  onClick={saveInvites}
  disabled={saving || overSelfServeLimit}
  className="rounded-full bg-[#c6a96b] px-5 py-2 text-sm font-medium text-black disabled:opacity-50"
>
  {saving
    ? "Saving..."
    : saved
      ? "Invites saved"
      : "Save invites"}
</button>

            <button
              type="button"
              onClick={() => copyText("Subject", subject)}
              className="rounded-full border border-[#c6a96b]/40 px-5 py-2 text-sm font-medium text-[#c6a96b]"
            >
              Copy subject
            </button>

            <button
              type="button"
              onClick={() => copyText("BCC list", bccList)}
              disabled={!bccList || overSelfServeLimit}
              className="rounded-full border border-[#c6a96b]/40 px-5 py-2 text-sm font-medium text-[#c6a96b] disabled:opacity-50"
            >
              Copy BCC
            </button>

            <button
              type="button"
              onClick={() => copyText("Message", body)}
              disabled={overSelfServeLimit}
              className="rounded-full bg-[#c6a96b] px-5 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              Copy message
            </button>
          </div>
        </div>

        <Link
          href={`/harmonize/system/${params.systemId}`}
          className="mt-8 inline-flex w-fit rounded-full border border-white/10 px-6 py-3 text-sm text-[#d8d2c6]"
        >
          Done
        </Link>
      </section>
    </main>
  </>
  )
}