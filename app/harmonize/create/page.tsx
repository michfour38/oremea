"use client"

import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

const allowedModes = [
  "couple",
  "family_adults",
  "team",
  "parallel_parenting_adults",
] as const

const modeLabels: Record<string, string> = {
  couple: "Couple",
  family_adults: "Family Adults",
  team: "Team",
  parallel_parenting_adults: "Parallel Parenting Adults",
}

export default function HarmonizeCreatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get("mode")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!mode || !allowedModes.includes(mode as any)) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-20 text-[#f4f1ea]">
        <div className="mx-auto max-w-2xl">
          <p>Invalid Harmonize mode.</p>
          <Link href="/harmonize" className="mt-4 inline-block text-[#c6a96b]">
            Return to Harmonize
          </Link>
        </div>
      </main>
    )
  }

  async function createSystem() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/harmonize/system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  mode,
  consentSnapshot: {
    acceptedAt: new Date().toISOString(),
    mode,
    agreementVersion: "harmonize-v1",
    principles: [
      "Private reflections remain private",
      "Shared repair is chosen not extracted",
      "Understanding is more important than agreement",
      "Repair is invitation not obligation",
      "Harmonize does not determine who is right",
      "Participants remain responsible for their own choices",
      "Minor participation is not available in this version",
    ],
    safetyAccepted: true,
  },
}),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to create Harmonize system")
      }

      router.push(`/harmonize/system/${data.system.id}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong creating the system.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
  className="min-h-screen text-[#f4f1ea]"
  style={{
    backgroundImage:
      "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), url('/images/harmonize/bg-harmonize-entry.webp')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  }}
>
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <Link
          href={`/harmonize/agreement?mode=${mode}`}
          className="mb-8 text-sm text-[#c6a96b] hover:underline"
        >
          ← Back
        </Link>

        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c6a96b]">
          Harmonize by Oremea
        </p>

        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Begin your {modeLabels[mode]} space
        </h1>

        <p className="mt-6 text-base leading-7 text-[#d8d2c6]">
          This creates the private container for your Harmonize process. You will enter as the first adult participant
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-medium">What begins here</h2>

          <div className="mt-5 space-y-4 text-sm leading-6 text-[#bfb8aa]">
            <p>A Harmonize system for this relationship structure</p>
            <p>Your participation is connected to your account</p>
            <p>A protected space where private reflection can begin</p>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={createSystem}
          disabled={loading}
          className="mt-8 inline-flex w-fit rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Beginning..." : "Create the container"}
        </button>
      </section>
    </main>
  )
}