"use client"

import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function HarmonizeJoinPage({
  params,
}: {
  params: { systemId: string }
}) {
  const { isSignedIn } = useUser()
  const router = useRouter()

  const [joining, setJoining] = useState(false)
  const [error, setError] = useState("")

  async function joinContainer() {
    setJoining(true)
    setError("")

    try {
      const response = await fetch("/api/harmonize/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemId: params.systemId }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to join Harmonize container")
      }

      router.push(`/harmonize/system/${params.systemId}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong joining this container",
      )
    } finally {
      setJoining(false)
    }
  }

  return (
    <main
      className="min-h-screen text-[#f4f1ea]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.74), rgba(0,0,0,0.74)), url('/images/harmonize/bg-harmonize-entry.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Join this Harmonize container
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          You have been invited to join a Harmonize container. Private
          reflections remain private. Shared repair is chosen, not extracted.
        </p>

        {!isSignedIn ? (
          <Link
            href={`/sign-in?redirect_url=/harmonize/join/${params.systemId}`}
            className="mt-8 inline-flex w-fit rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black"
          >
            Sign in to join
          </Link>
        ) : (
          <button
            type="button"
            onClick={joinContainer}
            disabled={joining}
            className="mt-8 inline-flex w-fit rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black disabled:opacity-60"
          >
            {joining ? "Joining..." : "Join container"}
          </button>
        )}

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  )
}