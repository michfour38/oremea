"use client"

import { SignOutButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react";

type InvitationState =
  | "signed_out"
  | "ready"
  | "wrong_account"
  | "already_participant"
  | "accepted"
  | "revoked"
  | "expired"
  | "unavailable"

type InvitationPreview = {
  id: string
  state: InvitationState
  systemName: string | null
  mode: string
  relationshipContext: string | null
  invitedEmail: string
  signedInEmail: string | null
  expiresAt: string | null
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

  return "Relationship"
}

export default function HarmonizeJoinPage(
  props: {
    params: Promise<{
      systemId: string
    }>
    searchParams: Promise<{
      invite?: string
    }>
  }
) {
  const searchParams = use(props.searchParams);
  const params = use(props.params);
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  const inviteId =
    searchParams.invite?.trim() || ""

  const joinPath = inviteId
    ? `/harmonize/join/${params.systemId}?invite=${encodeURIComponent(
        inviteId,
      )}`
    : `/harmonize/join/${params.systemId}`

  const [preview, setPreview] =
    useState<InvitationPreview | null>(null)

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const [
    consentAcknowledged,
    setConsentAcknowledged,
  ] = useState(false)

  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoaded) return

    if (!inviteId) {
      setPreview(null)
      setError(
        "This invitation link is incomplete.",
      )
      setLoading(false)

      return
    }

    let cancelled = false

    async function loadInvitation() {
      setLoading(true)
      setError("")

      try {
        const query = new URLSearchParams({
          systemId: params.systemId,
          inviteId,
        })

        const response = await fetch(
          `/api/harmonize/join?${query.toString()}`,
          {
            cache: "no-store",
          },
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Unable to read this invitation.",
          )
        }

        if (cancelled) return

        setPreview({
          id: data.invitation.id,
          state: data.state,
          systemName:
            data.system.name || null,
          mode: data.system.mode,
          relationshipContext:
            data.invitation
              .relationshipContext || null,
          invitedEmail:
            data.invitation.invitedEmail,
          signedInEmail:
            data.signedInEmail || null,
          expiresAt:
            data.invitation.expiresAt || null,
        })
      } catch (err) {
        if (cancelled) return

        setPreview(null)

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong loading this invitation.",
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInvitation()

    return () => {
      cancelled = true
    }
  }, [
    inviteId,
    isLoaded,
    isSignedIn,
    params.systemId,
  ])

  async function joinRelationshipSpace() {
    if (
      joining ||
      !consentAcknowledged ||
      !inviteId
    ) {
      return
    }

    setJoining(true)
    setError("")

    try {
      const response = await fetch(
        "/api/harmonize/join",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            systemId: params.systemId,
            inviteId,
            consentAcknowledged,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to join this Relationship Space.",
        )
      }

      router.push(
        `/harmonize/system/${params.systemId}`,
      )

      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong joining this Relationship Space.",
      )
    } finally {
      setJoining(false)
    }
  }

  const relationshipName =
    preview?.systemName?.trim() ||
    modeLabel(preview?.mode)

  return (
    <main
      className="min-h-screen text-[#f4f1ea]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.76), rgba(0,0,0,0.76)), url('/images/harmonize/bg-harmonize-entry.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-black/30 p-7 backdrop-blur-sm">
            <p className="text-sm text-[#bfb8aa]">
              Reading invitation...
            </p>
          </div>
        ) : null}

        {!loading && preview ? (
          <>
            <p className="text-sm leading-6 text-[#d8d2c6]">
              You have been invited to join
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              {relationshipName}
            </h1>

            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
              {modeLabel(preview.mode)}{" "}
              Relationship Space
            </p>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-7 backdrop-blur-sm">
              <p className="text-base leading-7 text-[#d8d2c6]">
                This Relationship Space has already
                been created. Joining allows you to
                participate in conversations held
                here.
              </p>

              {preview.relationshipContext ? (
                <div className="mt-6 border-t border-white/10 pt-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8f8778]">
                    Relationship context
                  </p>

                  <p className="mt-3 text-sm leading-6 text-[#f4f1ea]">
                    {
                      preview.relationshipContext
                    }
                  </p>
                </div>
              ) : null}
            </div>

            {preview.state === "signed_out" ? (
              <div className="mt-6 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
                <p className="text-sm leading-6 text-[#d8d2c6]">
                  Sign in with the account that
                  received this invitation at{" "}
                  <span className="text-[#f4f1ea]">
                    {preview.invitedEmail}
                  </span>
                  .
                </p>

                <Link
                  href={`/sign-in?redirect_url=${encodeURIComponent(
                    joinPath,
                  )}`}
                  className="mt-5 inline-flex rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
                >
                  Sign in to continue
                </Link>
              </div>
            ) : null}

            {preview.state ===
            "wrong_account" ? (
              <div className="mt-6 rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6">
                <h2 className="text-lg font-medium text-[#f4f1ea]">
                  This invitation was sent to
                  another account
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#d8d2c6]">
                  This invitation was sent to{" "}
                  <span className="text-[#f4f1ea]">
                    {preview.invitedEmail}
                  </span>
                  .
                </p>

                {preview.signedInEmail ? (
                  <p className="mt-2 text-sm leading-6 text-[#bfb8aa]">
                    You are currently signed in as{" "}
                    {preview.signedInEmail}.
                  </p>
                ) : null}

                <SignOutButton
                  redirectUrl={joinPath}
                >
                  <button
                    type="button"
                    className="mt-5 inline-flex rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
                  >
                    Sign in with the invited
                    account
                  </button>
                </SignOutButton>
              </div>
            ) : null}

            {preview.state === "ready" ? (
              <div className="mt-6 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={
                    consentAcknowledged
                  }
                  onClick={() =>
                    setConsentAcknowledged(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                  className="flex w-full items-start gap-4 text-left"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                      consentAcknowledged
                        ? "border-[#c6a96b] bg-[#c6a96b] text-black"
                        : "border-[#c6a96b]/60 text-transparent"
                    }`}
                  >
                    ✓
                  </span>

                  <span>
                    <span className="block text-sm font-medium text-[#f4f1ea]">
                      I understand how this
                      Relationship Space works
                    </span>

                    <span className="mt-2 block text-sm leading-6 text-[#d8d2c6]">
                      Private Witness remains
                      private. Nothing written
                      privately is automatically
                      shared. Shared understanding
                      only develops through
                      intentional participation.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={
                    joinRelationshipSpace
                  }
                  disabled={
                    joining ||
                    !consentAcknowledged
                  }
                  className="mt-6 inline-flex rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joining
                    ? "Joining..."
                    : "Join Relationship Space"}
                </button>
              </div>
            ) : null}

            {preview.state ===
            "already_participant" ? (
              <div className="mt-6 rounded-3xl border border-[#c6a96b]/30 bg-[#c6a96b]/10 p-6">
                <h2 className="text-lg font-medium text-[#f4f1ea]">
                  You are already a participant
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#d8d2c6]">
                  This Relationship Space is already
                  available from your Harmonize
                  account.
                </p>

                <Link
                  href={`/harmonize/system/${params.systemId}`}
                  className="mt-5 inline-flex rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
                >
                  Open Relationship Space
                </Link>
              </div>
            ) : null}

            {preview.state === "accepted" ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-medium text-[#f4f1ea]">
                  This invitation has already been
                  used
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
                  Ask for a new invitation if you
                  still need access to this
                  Relationship Space.
                </p>
              </div>
            ) : null}

            {preview.state === "revoked" ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-medium text-[#f4f1ea]">
                  This invitation has been revoked
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
                  It can no longer be used to join
                  this Relationship Space.
                </p>
              </div>
            ) : null}

            {preview.state === "expired" ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-medium text-[#f4f1ea]">
                  This invitation has expired
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
                  A new invitation is required to
                  join this Relationship Space.
                </p>
              </div>
            ) : null}

            {preview.state ===
            "unavailable" ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-medium text-[#f4f1ea]">
                  This Relationship Space is
                  unavailable
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
                  It is no longer accepting
                  participants.
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  )
}