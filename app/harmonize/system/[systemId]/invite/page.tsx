"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
const BASE_INCLUDED_PARTICIPANTS = 2
const BASE_PRICE = 1200
const EXTRA_PARTICIPANT_PRICE = 300
const SELF_SERVE_MAX_PARTICIPANTS = 10

export default function HarmonizeInvitePage({
  params,
}: {
  params: { systemId: string }
}) {
  const [emails, setEmails] = useState<string[]>([""])
  const [copied, setCopied] = useState("")
  const [error, setError] = useState("")
  const [inviteLink, setInviteLink] = useState("")

  useEffect(() => {
    setInviteLink(
      `${window.location.origin}/harmonize/join/${params.systemId}`,
    )
  }, [params.systemId])

  const subject = "Invitation to join a Harmonize container"

  const body = `I've created a Harmonize container for us.

Harmonize is a structured relational reflection space.
Private reflections remain private.
Shared repair is chosen not extracted.

Join here:
${inviteLink}

Please create or sign into your Oremea account before joining.

Harmonize by Oremea`

  function addParticipant() {
    setEmails((current) => [...current, ""])
  }

  function removeParticipant(index: number) {
    setEmails((current) => current.filter((_, i) => i !== index))
  }

  function updateEmail(index: number, value: string) {
    setEmails((current) => {
      const next = [...current]
      next[index] = value
      return next
    })
  }

  function validEmails() {
    return emails
      .map((email) => email.trim())
      .filter((email) => email && email.includes("@"))
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

  const bccList = validEmails().join(", ")
const totalParticipants = emails.length + 1
const extraParticipants = Math.max(
  0,
  totalParticipants - BASE_INCLUDED_PARTICIPANTS,
)
const monthlyPrice =
  BASE_PRICE + extraParticipants * EXTRA_PARTICIPANT_PRICE

const overSelfServeLimit =
  totalParticipants > SELF_SERVE_MAX_PARTICIPANTS

  return (
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
          ← Back to system
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Invite participants
        </h1>

        <p className="mt-6 whitespace-pre-line text-base leading-7 text-[#d8d2c6]">
          {`Invite participants privately.

Each participant joins with their own account.

Private reflections remain private.

Shared repair is chosen, not extracted.`}
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#f4f1ea]">Participants</p>

              <p className="mt-1 text-xs text-[#bfb8aa]">
                Add the people you would like to invite.
              </p>
            </div>

            <button
              type="button"
              onClick={addParticipant}
              className="rounded-full border border-[#c6a96b]/40 px-4 py-2 text-sm text-[#c6a96b]"
            >
              + Add participant
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {emails.map((email, index) => (
              <div key={index}>
                <label className="block text-sm leading-6 text-[#f4f1ea]">
                  Participant {index + 1} email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => updateEmail(index, event.target.value)}
                  placeholder="participant@example.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-[#f4f1ea] outline-none placeholder:text-[#777] focus:border-[#c6a96b]/60"
                />

                {emails.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeParticipant(index)}
                    className="mt-2 text-xs text-red-300"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

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

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {copied ? (
            <p className="mt-4 text-sm text-[#c6a96b]">{copied} copied.</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
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
  )
}